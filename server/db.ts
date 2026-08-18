import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  cashAttachments,
  cashTransactions,
  clients,
  expenses,
  legalMatters,
  revenues,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: new Date(),
    role: user.openId === ENV.ownerOpenId ? "admin" : user.role ?? "user",
  };
  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      lastSignedIn: new Date(),
      ...(user.openId === ENV.ownerOpenId ? { role: "admin" } : {}),
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listMatters() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: legalMatters.id,
      code: legalMatters.code,
      title: legalMatters.title,
      serviceType: legalMatters.serviceType,
      lawyerName: legalMatters.lawyerName,
      contractNumber: legalMatters.contractNumber,
      contractDate: legalMatters.contractDate,
      contractValue: legalMatters.contractValue,
      status: legalMatters.status,
      notes: legalMatters.notes,
      clientName: clients.name,
      clientTaxCode: clients.taxCode,
      clientId: clients.id,
      updatedAt: legalMatters.updatedAt,
    })
    .from(legalMatters)
    .innerJoin(clients, eq(legalMatters.clientId, clients.id))
    .orderBy(desc(legalMatters.updatedAt));
}

export async function createMatter(input: {
  code: string;
  title: string;
  clientName: string;
  clientTaxCode?: string;
  serviceType: string;
  lawyerName: string;
  contractNumber?: string;
  contractDate?: Date;
  contractValue: number;
  status: "draft" | "active" | "on_hold" | "completed" | "closed";
  notes?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(clients).where(eq(clients.name, input.clientName)).limit(1);
  let clientId = existing[0]?.id;
  if (!clientId) {
    await db.insert(clients).values({ name: input.clientName, taxCode: input.clientTaxCode || null });
    const createdClient = await db.select().from(clients).where(eq(clients.name, input.clientName)).limit(1);
    clientId = createdClient[0]?.id;
  }
  if (!clientId) throw new Error("Không thể tạo khách hàng");
  await db.insert(legalMatters).values({
    code: input.code,
    title: input.title,
    clientId,
    serviceType: input.serviceType,
    lawyerName: input.lawyerName,
    contractNumber: input.contractNumber || null,
    contractDate: input.contractDate ?? null,
    contractValue: input.contractValue.toFixed(2),
    status: input.status,
    notes: input.notes || null,
    createdBy: input.createdBy,
  });
  return { success: true };
}

export async function updateMatter(id: number, input: Partial<{
  title: string; serviceType: string; lawyerName: string; contractNumber: string; contractDate: Date | null;
  contractValue: number; status: "draft" | "active" | "on_hold" | "completed" | "closed"; notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { contractValue, ...rest } = input;
  await db.update(legalMatters).set({
    ...rest,
    ...(contractValue !== undefined ? { contractValue: contractValue.toFixed(2) } : {}),
  }).where(eq(legalMatters.id, id));
}

export async function listRevenues() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: revenues.id, matterId: revenues.matterId, invoiceNumber: revenues.invoiceNumber, invoiceDate: revenues.invoiceDate,
    serviceDate: revenues.serviceDate, amountBeforeTax: revenues.amountBeforeTax, vatRate: revenues.vatRate,
    vatOutput: revenues.vatOutput, totalAmount: revenues.totalAmount, collectedAmount: revenues.collectedAmount,
    dueDate: revenues.dueDate, status: revenues.status, notes: revenues.notes, matterCode: legalMatters.code,
    matterTitle: legalMatters.title, clientName: clients.name, updatedAt: revenues.updatedAt,
  }).from(revenues)
    .leftJoin(legalMatters, eq(revenues.matterId, legalMatters.id))
    .leftJoin(clients, eq(legalMatters.clientId, clients.id))
    .orderBy(desc(revenues.serviceDate));
}

function revenueStatus(total: number, collected: number, dueDate?: Date | null) {
  if (collected >= total && total > 0) return "collected" as const;
  if (collected > 0) return "partial" as const;
  if (dueDate && dueDate.getTime() < Date.now()) return "overdue" as const;
  return "issued" as const;
}

export async function createRevenue(input: {
  matterId?: number | null; invoiceNumber?: string; invoiceDate?: Date | null; serviceDate: Date;
  amountBeforeTax: number; vatRate: number; collectedAmount: number; dueDate?: Date | null; notes?: string; createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const vatOutput = input.amountBeforeTax * input.vatRate;
  const totalAmount = input.amountBeforeTax + vatOutput;
  await db.insert(revenues).values({
    matterId: input.matterId ?? null, invoiceNumber: input.invoiceNumber || null, invoiceDate: input.invoiceDate ?? null,
    serviceDate: input.serviceDate, amountBeforeTax: input.amountBeforeTax.toFixed(2), vatRate: input.vatRate.toFixed(4),
    vatOutput: vatOutput.toFixed(2), totalAmount: totalAmount.toFixed(2), collectedAmount: input.collectedAmount.toFixed(2),
    dueDate: input.dueDate ?? null, status: revenueStatus(totalAmount, input.collectedAmount, input.dueDate),
    notes: input.notes || null, createdBy: input.createdBy,
  });
  return { success: true };
}

export async function updateRevenue(id: number, input: Partial<{
  matterId: number | null; invoiceNumber: string; invoiceDate: Date | null; serviceDate: Date; amountBeforeTax: number;
  vatRate: number; collectedAmount: number; dueDate: Date | null; notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(revenues).where(eq(revenues.id, id)).limit(1);
  if (!current[0]) throw new Error("Không tìm thấy dòng doanh thu");
  const amountBeforeTax = input.amountBeforeTax ?? Number(current[0].amountBeforeTax);
  const vatRate = input.vatRate ?? Number(current[0].vatRate);
  const totalAmount = amountBeforeTax * (1 + vatRate);
  const collectedAmount = input.collectedAmount ?? Number(current[0].collectedAmount);
  const dueDate = input.dueDate ?? current[0].dueDate;
  await db.update(revenues).set({
    ...input,
    amountBeforeTax: amountBeforeTax.toFixed(2), vatRate: vatRate.toFixed(4), vatOutput: (amountBeforeTax * vatRate).toFixed(2),
    totalAmount: totalAmount.toFixed(2), collectedAmount: collectedAmount.toFixed(2), status: revenueStatus(totalAmount, collectedAmount, dueDate),
  }).where(eq(revenues.id, id));
}

export async function listExpenses() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: expenses.id, matterId: expenses.matterId, supplierName: expenses.supplierName, category: expenses.category,
    expenseDate: expenses.expenseDate, invoiceNumber: expenses.invoiceNumber, invoiceDate: expenses.invoiceDate,
    amountBeforeTax: expenses.amountBeforeTax, vatRate: expenses.vatRate, vatInput: expenses.vatInput,
    totalAmount: expenses.totalAmount, paidAmount: expenses.paidAmount, dueDate: expenses.dueDate,
    paymentStatus: expenses.paymentStatus, deductibility: expenses.deductibility, notes: expenses.notes,
    matterCode: legalMatters.code, matterTitle: legalMatters.title, updatedAt: expenses.updatedAt,
  }).from(expenses).leftJoin(legalMatters, eq(expenses.matterId, legalMatters.id)).orderBy(desc(expenses.expenseDate));
}

function expenseStatus(total: number, paid: number) {
  if (paid >= total && total > 0) return "paid" as const;
  if (paid > 0) return "partial" as const;
  return "unpaid" as const;
}

export async function createExpense(input: {
  matterId?: number | null; supplierName: string; category: string; expenseDate: Date; invoiceNumber?: string;
  invoiceDate?: Date | null; amountBeforeTax: number; vatRate: number; paidAmount: number; dueDate?: Date | null;
  deductibility: "deductible" | "non_deductible" | "pending"; notes?: string; createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const vatInput = input.amountBeforeTax * input.vatRate;
  const totalAmount = input.amountBeforeTax + vatInput;
  await db.insert(expenses).values({
    matterId: input.matterId ?? null, supplierName: input.supplierName, category: input.category, expenseDate: input.expenseDate,
    invoiceNumber: input.invoiceNumber || null, invoiceDate: input.invoiceDate ?? null, amountBeforeTax: input.amountBeforeTax.toFixed(2),
    vatRate: input.vatRate.toFixed(4), vatInput: vatInput.toFixed(2), totalAmount: totalAmount.toFixed(2),
    paidAmount: input.paidAmount.toFixed(2), dueDate: input.dueDate ?? null, paymentStatus: expenseStatus(totalAmount, input.paidAmount),
    deductibility: input.deductibility, notes: input.notes || null, createdBy: input.createdBy,
  });
  return { success: true };
}

export async function updateExpense(id: number, input: Partial<{
  matterId: number | null; supplierName: string; category: string; expenseDate: Date; invoiceNumber: string; invoiceDate: Date | null;
  amountBeforeTax: number; vatRate: number; paidAmount: number; dueDate: Date | null;
  deductibility: "deductible" | "non_deductible" | "pending"; notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!current[0]) throw new Error("Không tìm thấy dòng chi phí");
  const amountBeforeTax = input.amountBeforeTax ?? Number(current[0].amountBeforeTax);
  const vatRate = input.vatRate ?? Number(current[0].vatRate);
  const totalAmount = amountBeforeTax * (1 + vatRate);
  const paidAmount = input.paidAmount ?? Number(current[0].paidAmount);
  await db.update(expenses).set({
    ...input,
    amountBeforeTax: amountBeforeTax.toFixed(2), vatRate: vatRate.toFixed(4), vatInput: (amountBeforeTax * vatRate).toFixed(2),
    totalAmount: totalAmount.toFixed(2), paidAmount: paidAmount.toFixed(2), paymentStatus: expenseStatus(totalAmount, paidAmount),
  }).where(eq(expenses.id, id));
}

export async function listCashTransactions() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: cashTransactions.id, transactionDate: cashTransactions.transactionDate, type: cashTransactions.type,
    amount: cashTransactions.amount, paymentMethod: cashTransactions.paymentMethod, referenceType: cashTransactions.referenceType,
    referenceId: cashTransactions.referenceId, matterId: cashTransactions.matterId, documentNumber: cashTransactions.documentNumber,
    description: cashTransactions.description, reconciled: cashTransactions.reconciled, matterCode: legalMatters.code,
    matterTitle: legalMatters.title, updatedAt: cashTransactions.updatedAt,
  }).from(cashTransactions).leftJoin(legalMatters, eq(cashTransactions.matterId, legalMatters.id)).orderBy(desc(cashTransactions.transactionDate));
}

export async function createCashTransaction(input: {
  transactionDate: Date; type: "receipt" | "payment"; amount: number;
  paymentMethod: "bank" | "cash" | "transfer" | "other"; referenceType: "revenue" | "expense" | "other";
  referenceId?: number | null; matterId?: number | null; documentNumber?: string; description: string; reconciled: boolean; createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(cashTransactions).values({
    ...input, amount: input.amount.toFixed(2), referenceId: input.referenceId ?? null, matterId: input.matterId ?? null,
    documentNumber: input.documentNumber || null,
  });
  return { success: true };
}

export async function getCashTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ id: cashTransactions.id }).from(cashTransactions).where(eq(cashTransactions.id, id)).limit(1);
  return rows[0];
}

export async function listCashAttachments(cashTransactionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: cashAttachments.id,
    originalFileName: cashAttachments.originalFileName,
    contentType: cashAttachments.contentType,
    storageUrl: cashAttachments.storageUrl,
    fileSize: cashAttachments.fileSize,
    createdAt: cashAttachments.createdAt,
  }).from(cashAttachments).where(eq(cashAttachments.cashTransactionId, cashTransactionId)).orderBy(desc(cashAttachments.createdAt));
}

export async function createCashAttachment(input: {
  cashTransactionId: number;
  originalFileName: string;
  contentType: string;
  storageKey: string;
  storageUrl: string;
  fileSize: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(cashAttachments).values(input);
  return { success: true };
}

type DashboardSource = {
  matterRows: Array<{ status: string }>;
  revenueRows: Array<{ status: string; serviceDate: Date; updatedAt: Date; amountBeforeTax: string | number; totalAmount: string | number; collectedAmount: string | number }>;
  expenseRows: Array<{ expenseDate: Date; updatedAt: Date; amountBeforeTax: string | number; totalAmount: string | number; paidAmount: string | number }>;
  cashRows: Array<{ transactionDate: Date; updatedAt: Date; type: "receipt" | "payment"; amount: string | number }>;
};

export function calculateDashboardMetrics(source: DashboardSource, start?: Date, end?: Date) {
  const { matterRows, revenueRows, expenseRows, cashRows } = source;
  const inRange = (date: Date | null, fallback: Date) => {
    const value = date ?? fallback;
    return (!start || value >= start) && (!end || value <= end);
  };
  const selectedRevenues = revenueRows.filter(row => row.status !== "void" && inRange(row.serviceDate, row.updatedAt));
  const selectedExpenses = expenseRows.filter(row => inRange(row.expenseDate, row.updatedAt));
  const selectedCash = cashRows.filter(row => inRange(row.transactionDate, row.updatedAt));
  const sum = <T>(rows: T[], getValue: (row: T) => number) => rows.reduce((total, row) => total + getValue(row), 0);
  const totalRevenue = sum(selectedRevenues, row => Number(row.amountBeforeTax));
  const receivable = sum(selectedRevenues, row => Math.max(0, Number(row.totalAmount) - Number(row.collectedAmount)));
  const payable = sum(selectedExpenses, row => Math.max(0, Number(row.totalAmount) - Number(row.paidAmount)));
  const actualReceipts = sum(selectedCash.filter(row => row.type === "receipt"), row => Number(row.amount));
  const actualPayments = sum(selectedCash.filter(row => row.type === "payment"), row => Number(row.amount));
  const totalExpenses = sum(selectedExpenses, row => Number(row.amountBeforeTax));
  const monthly = new Map<string, { month: string; revenue: number; expense: number; cashFlow: number }>();
  const registerMonth = (date: Date, key: "revenue" | "expense" | "cashFlow", amount: number) => {
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = monthly.get(month) ?? { month, revenue: 0, expense: 0, cashFlow: 0 };
    current[key] += amount;
    monthly.set(month, current);
  };
  selectedRevenues.forEach(row => registerMonth(row.serviceDate, "revenue", Number(row.amountBeforeTax)));
  selectedExpenses.forEach(row => registerMonth(row.expenseDate, "expense", Number(row.amountBeforeTax)));
  selectedCash.forEach(row => registerMonth(row.transactionDate, "cashFlow", row.type === "receipt" ? Number(row.amount) : -Number(row.amount)));
  return {
    kpis: { totalRevenue, actualReceipts, actualPayments, profit: totalRevenue - totalExpenses, receivable, payable },
    monthly: Array.from(monthly.values()).sort((a, b) => a.month.localeCompare(b.month)),
    counts: { matters: matterRows.length, activeMatters: matterRows.filter(row => row.status === "active").length, overdueRevenue: revenueRows.filter(row => row.status === "overdue").length },
  };
}

export async function getDashboardData(start?: Date, end?: Date) {
  const [matterRows, revenueRows, expenseRows, cashRows] = await Promise.all([listMatters(), listRevenues(), listExpenses(), listCashTransactions()]);
  return calculateDashboardMetrics({ matterRows, revenueRows, expenseRows, cashRows }, start, end);
}

export async function deleteById(table: "matter" | "revenue" | "expense" | "cash", id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (table === "matter") return db.delete(legalMatters).where(eq(legalMatters.id, id));
  if (table === "revenue") return db.delete(revenues).where(eq(revenues.id, id));
  if (table === "expense") return db.delete(expenses).where(eq(expenses.id, id));
  return db.delete(cashTransactions).where(eq(cashTransactions.id, id));
}
