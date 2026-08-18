import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { ENV } from "../_core/env";
import { protectedProcedure, router } from "../_core/trpc";
import { DELEGABLE_PERMISSIONS, type DelegablePermission } from "../permissions";
import { storagePut } from "../storage";

const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.openId !== ENV.ownerOpenId) throw new TRPCError({ code: "FORBIDDEN", message: "Chỉ chủ sở hữu dự án được phép quản lý vai trò tài khoản." });
  return next({ ctx });
});

const accountantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner" && ctx.user.role !== "admin" && ctx.user.role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Tài khoản không có quyền truy cập nghiệp vụ tài chính." });
  }
  return next({ ctx });
});

function delegatedPermissionProcedure(permission: DelegablePermission) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const profile = await db.getUserAccessProfile(ctx.user);
    if (!profile.isOwner && !profile.permissions.includes(permission)) throw new TRPCError({ code: "FORBIDDEN", message: "Tài khoản chưa được chủ sở hữu ủy quyền cho thao tác này." });
    return next({ ctx });
  });
}

const reportReviewProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const profile = await db.getUserAccessProfile(ctx.user);
  const canReview = profile.isOwner || profile.permissions.includes("approve_report_level_1") || profile.permissions.includes("approve_report_level_2") || profile.permissions.includes("reject_report");
  if (!canReview) throw new TRPCError({ code: "FORBIDDEN", message: "Tài khoản chưa được ủy quyền xem xét hoặc từ chối báo cáo." });
  return next({ ctx });
});

const optionalDate = z.number().int().nullable().optional();
const matterStatus = z.enum(["draft", "active", "on_hold", "completed", "closed"]);
const paymentMethod = z.enum(["bank", "cash", "transfer", "other"]);
const cashAccountCode = z.enum(["1111", "1121", "131", "331", "3331", "5113", "642"]);
const revenueAccountCode = z.enum(["5113", "515", "711"]);
const expenseAccountCode = z.enum(["635", "642", "811"]);
const revenueCategory = z.enum(["legal_service", "retainer", "litigation", "consultancy", "reimbursement", "other_income"]);
const expenseCategory = z.enum(["payroll", "office", "technology", "travel", "tax_fee", "professional_service", "other_expense", "other"]);
const cashCategory = z.enum([
  "legal_service", "reimbursement", "other_income", "payroll", "office", "technology",
  "travel", "tax_fee", "professional_service", "other_expense", "other",
]);
const attachmentTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
const maxAttachmentBytes = 8 * 1024 * 1024;
const periodKey = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Kỳ kế toán phải có định dạng YYYY-MM.");

function safeAttachmentName(fileName: string) {
  return fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 180) || "chung-tu";
}

export const financeRouter = router({
  access: accountantProcedure.query(async ({ ctx }) => {
    const profile = await db.getUserAccessProfile(ctx.user);
    const has = (permission: DelegablePermission) => profile.isOwner || profile.permissions.includes(permission);
    return {
      role: profile.role, isOwner: profile.isOwner, permissions: profile.permissions, canView: true, canCreate: true, canEdit: true,
      canDelete: has("delete_financial_data"), canManageAccess: profile.isOwner, canRequestApproval: true,
      canApprovePeriod: has("approve_month_close"), canLockPeriod: has("lock_month_close"), canReopenPeriod: has("reopen_month_close"),
      canApproveReportLevelOne: has("approve_report_level_1"), canApproveReportLevelTwo: has("approve_report_level_2"), canRejectReport: has("reject_report"),
    };
  }),
  dashboard: accountantProcedure.input(z.object({ start: optionalDate, end: optionalDate }).optional()).query(({ input }) =>
    db.getDashboardData(input?.start ? new Date(input.start) : undefined, input?.end ? new Date(input.end) : undefined)),
  closing: router({
    overview: accountantProcedure.input(z.object({ periodKey })).query(({ input }) => db.getAccountingPeriodOverview(input.periodKey)),
    request: accountantProcedure.input(z.object({ periodKey, note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.requestPeriodApproval(input.periodKey, ctx.user.id, input.note)),
    approve: delegatedPermissionProcedure("approve_month_close").input(z.object({ periodKey, note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.approvePeriod(input.periodKey, ctx.user.id, input.note)),
    reject: delegatedPermissionProcedure("approve_month_close").input(z.object({ periodKey, reason: z.string().min(5).max(1000) })).mutation(({ ctx, input }) => db.rejectPeriod(input.periodKey, ctx.user.id, input.reason)),
    lock: delegatedPermissionProcedure("lock_month_close").input(z.object({ periodKey, note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.lockPeriod(input.periodKey, ctx.user.id, input.note)),
    reopen: delegatedPermissionProcedure("reopen_month_close").input(z.object({ periodKey, reason: z.string().min(5).max(1000) })).mutation(({ ctx, input }) => db.reopenPeriod(input.periodKey, ctx.user.id, input.reason)),
  }),
  reportApproval: router({
    overview: accountantProcedure.input(z.object({ periodKey })).query(({ input }) => db.getReportApprovalOverview(input.periodKey)),
    request: accountantProcedure.input(z.object({ periodKey, note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.requestReportApproval(input.periodKey, ctx.user.id, input.note)),
    approveLevelOne: delegatedPermissionProcedure("approve_report_level_1").input(z.object({ requestId: z.number().int().positive(), note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.approveReportLevelOne(input.requestId, ctx.user.id, input.note)),
    approveLevelTwo: delegatedPermissionProcedure("approve_report_level_2").input(z.object({ requestId: z.number().int().positive(), note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.approveReportLevelTwo(input.requestId, ctx.user.id, input.note)),
    reject: reportReviewProcedure.input(z.object({ requestId: z.number().int().positive(), reason: z.string().min(5).max(1000) })).mutation(({ ctx, input }) => db.rejectReportApproval(input.requestId, ctx.user.id, input.reason)),
  }),
  accessControl: router({
    directory: ownerProcedure.query(() => db.listAccessDirectory()),
    inviteByEmail: ownerProcedure.input(z.object({ email: z.string().email(), role: z.enum(["admin", "staff"]), permissions: z.array(z.enum(DELEGABLE_PERMISSIONS)).max(DELEGABLE_PERMISSIONS.length), expiresAt: z.number().int().positive().nullable().optional(), permissionExpiries: z.array(z.object({ permission: z.enum(DELEGABLE_PERMISSIONS), expiresAt: z.number().int().positive().nullable() })).optional() })).mutation(({ ctx, input }) => db.inviteUserByEmail({ ...input, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null, permissionExpiries: Object.fromEntries((input.permissionExpiries ?? []).map(value => [value.permission, value.expiresAt ? new Date(value.expiresAt) : null])), actorId: ctx.user.id })),
    setUserAccess: ownerProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["admin", "staff"]), permissions: z.array(z.enum(DELEGABLE_PERMISSIONS)).max(DELEGABLE_PERMISSIONS.length), expiresAt: z.number().int().positive().nullable().optional(), permissionExpiries: z.array(z.object({ permission: z.enum(DELEGABLE_PERMISSIONS), expiresAt: z.number().int().positive().nullable() })).optional() })).mutation(({ ctx, input }) => db.setUserAccessProfile({ ...input, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null, permissionExpiries: Object.fromEntries((input.permissionExpiries ?? []).map(value => [value.permission, value.expiresAt ? new Date(value.expiresAt) : null])), actorId: ctx.user.id })),
  }),
  reconciliationReport: accountantProcedure.input(z.object({ periodKey })).query(({ input }) => db.getReconciliationReport(input.periodKey)),
  matters: router({
    list: accountantProcedure.query(() => db.listMatters()),
    create: accountantProcedure.input(z.object({
      code: z.string().min(2), title: z.string().min(2), clientName: z.string().min(2), clientTaxCode: z.string().optional(),
      serviceType: z.string().min(2), lawyerName: z.string().min(2), contractNumber: z.string().optional(), contractDate: optionalDate,
      contractValue: z.number().nonnegative(), status: matterStatus, notes: z.string().optional(),
    })).mutation(({ ctx, input }) => db.createMatter({ ...input, contractDate: input.contractDate ? new Date(input.contractDate) : undefined, createdBy: ctx.user.id })),
    update: accountantProcedure.input(z.object({
      id: z.number().int(), title: z.string().min(2).optional(), serviceType: z.string().min(2).optional(), lawyerName: z.string().min(2).optional(),
      contractNumber: z.string().optional(), contractDate: optionalDate, contractValue: z.number().nonnegative().optional(), status: matterStatus.optional(), notes: z.string().optional(),
    })).mutation(({ input }) => db.updateMatter(input.id, { ...input, contractDate: input.contractDate === undefined ? undefined : input.contractDate ? new Date(input.contractDate) : null })),
    delete: delegatedPermissionProcedure("delete_financial_data").input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteById("matter", input.id)),
  }),
  revenues: router({
    list: accountantProcedure.query(() => db.listRevenues()),
    create: accountantProcedure.input(z.object({
      matterId: z.number().int().nullable().optional(), invoiceNumber: z.string().optional(), invoiceDate: optionalDate, serviceDate: z.number().int(),
      accountCode: revenueAccountCode, category: revenueCategory, amountBeforeTax: z.number().positive(), vatRate: z.number().min(0).max(1), collectedAmount: z.number().min(0), dueDate: optionalDate, notes: z.string().optional(),
    })).mutation(({ ctx, input }) => db.createRevenue({ ...input, invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null, serviceDate: new Date(input.serviceDate), dueDate: input.dueDate ? new Date(input.dueDate) : null, createdBy: ctx.user.id })),
    update: accountantProcedure.input(z.object({
      id: z.number().int(), matterId: z.number().int().nullable().optional(), invoiceNumber: z.string().optional(), invoiceDate: optionalDate,
      serviceDate: z.number().int().optional(), accountCode: revenueAccountCode.optional(), category: revenueCategory.optional(), amountBeforeTax: z.number().positive().optional(), vatRate: z.number().min(0).max(1).optional(),
      collectedAmount: z.number().min(0).optional(), dueDate: optionalDate, notes: z.string().optional(),
    })).mutation(({ input }) => db.updateRevenue(input.id, { ...input, invoiceDate: input.invoiceDate === undefined ? undefined : input.invoiceDate ? new Date(input.invoiceDate) : null, serviceDate: input.serviceDate ? new Date(input.serviceDate) : undefined, dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null })),
    delete: delegatedPermissionProcedure("delete_financial_data").input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteById("revenue", input.id)),
  }),
  expenses: router({
    list: accountantProcedure.query(() => db.listExpenses()),
    create: accountantProcedure.input(z.object({
      matterId: z.number().int().nullable().optional(), supplierName: z.string().min(2), category: z.string().min(2), expenseDate: z.number().int(),
      accountCode: expenseAccountCode, categoryCode: expenseCategory, invoiceNumber: z.string().optional(), invoiceDate: optionalDate, amountBeforeTax: z.number().positive(), vatRate: z.number().min(0).max(1),
      paidAmount: z.number().min(0), dueDate: optionalDate, deductibility: z.enum(["deductible", "non_deductible", "pending"]), notes: z.string().optional(),
    })).mutation(({ ctx, input }) => db.createExpense({ ...input, expenseDate: new Date(input.expenseDate), invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null, dueDate: input.dueDate ? new Date(input.dueDate) : null, createdBy: ctx.user.id })),
    update: accountantProcedure.input(z.object({
      id: z.number().int(), matterId: z.number().int().nullable().optional(), supplierName: z.string().min(2).optional(), category: z.string().min(2).optional(),
      expenseDate: z.number().int().optional(), accountCode: expenseAccountCode.optional(), categoryCode: expenseCategory.optional(), invoiceNumber: z.string().optional(), invoiceDate: optionalDate, amountBeforeTax: z.number().positive().optional(),
      vatRate: z.number().min(0).max(1).optional(), paidAmount: z.number().min(0).optional(), dueDate: optionalDate,
      deductibility: z.enum(["deductible", "non_deductible", "pending"]).optional(), notes: z.string().optional(),
    })).mutation(({ input }) => db.updateExpense(input.id, { ...input, expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined, invoiceDate: input.invoiceDate === undefined ? undefined : input.invoiceDate ? new Date(input.invoiceDate) : null, dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null })),
    delete: delegatedPermissionProcedure("delete_financial_data").input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteById("expense", input.id)),
  }),
  cash: router({
    list: accountantProcedure.query(() => db.listCashTransactions()),
    create: accountantProcedure.input(z.object({
      transactionDate: z.number().int(), type: z.enum(["receipt", "payment"]), amount: z.number().positive(), paymentMethod,
      accountCode: cashAccountCode, category: cashCategory,
      referenceType: z.enum(["revenue", "expense", "other"]), referenceId: z.number().int().nullable().optional(), matterId: z.number().int().nullable().optional(),
      documentNumber: z.string().optional(), description: z.string().min(2), reconciled: z.boolean().default(false),
    })).mutation(({ ctx, input }) => db.createCashTransaction({ ...input, transactionDate: new Date(input.transactionDate), createdBy: ctx.user.id })),
    update: accountantProcedure.input(z.object({
      id: z.number().int(), transactionDate: z.number().int().optional(), type: z.enum(["receipt", "payment"]).optional(), amount: z.number().positive().optional(), paymentMethod: paymentMethod.optional(),
      accountCode: cashAccountCode.optional(), category: cashCategory.optional(), referenceType: z.enum(["revenue", "expense", "other"]).optional(), referenceId: z.number().int().nullable().optional(), matterId: z.number().int().nullable().optional(),
      documentNumber: z.string().optional(), description: z.string().min(2).optional(), reconciled: z.boolean().optional(),
    })).mutation(({ input }) => db.updateCashTransaction(input.id, { ...input, transactionDate: input.transactionDate ? new Date(input.transactionDate) : undefined })),
    attachments: router({
      list: accountantProcedure.input(z.object({ cashTransactionId: z.number().int().positive() })).query(({ input }) => db.listCashAttachments(input.cashTransactionId)),
      upload: accountantProcedure.input(z.object({
        cashTransactionId: z.number().int().positive(),
        originalFileName: z.string().min(1).max(255),
        contentType: z.enum(attachmentTypes),
        dataBase64: z.string().min(1),
      })).mutation(async ({ ctx, input }) => {
        const transaction = await db.getCashTransactionById(input.cashTransactionId);
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy giao dịch thu–chi." });
        const bytes = Buffer.from(input.dataBase64, "base64");
        if (!bytes.length || bytes.length > maxAttachmentBytes) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Tệp chứng từ phải nhỏ hơn hoặc bằng 8 MB." });
        const safeName = safeAttachmentName(input.originalFileName);
        const { key, url } = await storagePut(`cash-attachments/${ctx.user.id}/${input.cashTransactionId}/${safeName}`, bytes, input.contentType);
        return db.createCashAttachment({
          cashTransactionId: input.cashTransactionId,
          originalFileName: input.originalFileName,
          contentType: input.contentType,
          storageKey: key,
          storageUrl: url,
          fileSize: bytes.length,
          createdBy: ctx.user.id,
        });
      }),
    }),
    delete: delegatedPermissionProcedure("delete_financial_data").input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteById("cash", input.id)),
  }),
});
