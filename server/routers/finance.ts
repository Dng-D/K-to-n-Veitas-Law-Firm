import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Chỉ chủ sở hữu được phép thực hiện thao tác này." });
  return next({ ctx });
});

const accountantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "user") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Tài khoản không có quyền truy cập nghiệp vụ tài chính." });
  }
  return next({ ctx });
});

const optionalDate = z.number().int().nullable().optional();
const matterStatus = z.enum(["draft", "active", "on_hold", "completed", "closed"]);
const paymentMethod = z.enum(["bank", "cash", "transfer", "other"]);

export const financeRouter = router({
  access: accountantProcedure.query(({ ctx }) => ({
    role: ctx.user.role, canView: true, canCreate: true, canEdit: true,
    canDelete: ctx.user.role === "admin", canManageAccess: ctx.user.role === "admin",
  })),
  dashboard: accountantProcedure.input(z.object({ start: optionalDate, end: optionalDate }).optional()).query(({ input }) =>
    db.getDashboardData(input?.start ? new Date(input.start) : undefined, input?.end ? new Date(input.end) : undefined)),
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
    delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteById("matter", input.id)),
  }),
  revenues: router({
    list: accountantProcedure.query(() => db.listRevenues()),
    create: accountantProcedure.input(z.object({
      matterId: z.number().int().nullable().optional(), invoiceNumber: z.string().optional(), invoiceDate: optionalDate, serviceDate: z.number().int(),
      amountBeforeTax: z.number().positive(), vatRate: z.number().min(0).max(1), collectedAmount: z.number().min(0), dueDate: optionalDate, notes: z.string().optional(),
    })).mutation(({ ctx, input }) => db.createRevenue({ ...input, invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null, serviceDate: new Date(input.serviceDate), dueDate: input.dueDate ? new Date(input.dueDate) : null, createdBy: ctx.user.id })),
    update: accountantProcedure.input(z.object({
      id: z.number().int(), matterId: z.number().int().nullable().optional(), invoiceNumber: z.string().optional(), invoiceDate: optionalDate,
      serviceDate: z.number().int().optional(), amountBeforeTax: z.number().positive().optional(), vatRate: z.number().min(0).max(1).optional(),
      collectedAmount: z.number().min(0).optional(), dueDate: optionalDate, notes: z.string().optional(),
    })).mutation(({ input }) => db.updateRevenue(input.id, { ...input, invoiceDate: input.invoiceDate === undefined ? undefined : input.invoiceDate ? new Date(input.invoiceDate) : null, serviceDate: input.serviceDate ? new Date(input.serviceDate) : undefined, dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null })),
    delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteById("revenue", input.id)),
  }),
  expenses: router({
    list: accountantProcedure.query(() => db.listExpenses()),
    create: accountantProcedure.input(z.object({
      matterId: z.number().int().nullable().optional(), supplierName: z.string().min(2), category: z.string().min(2), expenseDate: z.number().int(),
      invoiceNumber: z.string().optional(), invoiceDate: optionalDate, amountBeforeTax: z.number().positive(), vatRate: z.number().min(0).max(1),
      paidAmount: z.number().min(0), dueDate: optionalDate, deductibility: z.enum(["deductible", "non_deductible", "pending"]), notes: z.string().optional(),
    })).mutation(({ ctx, input }) => db.createExpense({ ...input, expenseDate: new Date(input.expenseDate), invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null, dueDate: input.dueDate ? new Date(input.dueDate) : null, createdBy: ctx.user.id })),
    update: accountantProcedure.input(z.object({
      id: z.number().int(), matterId: z.number().int().nullable().optional(), supplierName: z.string().min(2).optional(), category: z.string().min(2).optional(),
      expenseDate: z.number().int().optional(), invoiceNumber: z.string().optional(), invoiceDate: optionalDate, amountBeforeTax: z.number().positive().optional(),
      vatRate: z.number().min(0).max(1).optional(), paidAmount: z.number().min(0).optional(), dueDate: optionalDate,
      deductibility: z.enum(["deductible", "non_deductible", "pending"]).optional(), notes: z.string().optional(),
    })).mutation(({ input }) => db.updateExpense(input.id, { ...input, expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined, invoiceDate: input.invoiceDate === undefined ? undefined : input.invoiceDate ? new Date(input.invoiceDate) : null, dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null })),
    delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteById("expense", input.id)),
  }),
  cash: router({
    list: accountantProcedure.query(() => db.listCashTransactions()),
    create: accountantProcedure.input(z.object({
      transactionDate: z.number().int(), type: z.enum(["receipt", "payment"]), amount: z.number().positive(), paymentMethod,
      referenceType: z.enum(["revenue", "expense", "other"]), referenceId: z.number().int().nullable().optional(), matterId: z.number().int().nullable().optional(),
      documentNumber: z.string().optional(), description: z.string().min(2), reconciled: z.boolean().default(false),
    })).mutation(({ ctx, input }) => db.createCashTransaction({ ...input, transactionDate: new Date(input.transactionDate), createdBy: ctx.user.id })),
    delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteById("cash", input.id)),
  }),
});
