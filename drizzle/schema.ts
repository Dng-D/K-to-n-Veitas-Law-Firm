import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  taxCode: varchar("taxCode", { length: 64 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const legalMatters = mysqlTable("legalMatters", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  clientId: int("clientId").notNull().references(() => clients.id),
  serviceType: varchar("serviceType", { length: 128 }).notNull(),
  lawyerName: varchar("lawyerName", { length: 255 }).notNull(),
  contractNumber: varchar("contractNumber", { length: 128 }),
  contractDate: timestamp("contractDate"),
  contractValue: decimal("contractValue", { precision: 18, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["draft", "active", "on_hold", "completed", "closed"]).default("draft").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const revenues = mysqlTable("revenues", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId").references(() => legalMatters.id),
  invoiceNumber: varchar("invoiceNumber", { length: 128 }),
  invoiceDate: timestamp("invoiceDate"),
  serviceDate: timestamp("serviceDate").notNull(),
  accountCode: varchar("accountCode", { length: 16 }).default("5113").notNull(),
  category: varchar("category", { length: 128 }).default("legal_service").notNull(),
  amountBeforeTax: decimal("amountBeforeTax", { precision: 18, scale: 2 }).notNull(),
  vatRate: decimal("vatRate", { precision: 7, scale: 4 }).default("0.1").notNull(),
  vatOutput: decimal("vatOutput", { precision: 18, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).notNull(),
  collectedAmount: decimal("collectedAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["issued", "partial", "collected", "overdue", "void"]).default("issued").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId").references(() => legalMatters.id),
  supplierName: varchar("supplierName", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  accountCode: varchar("accountCode", { length: 16 }).default("642").notNull(),
  categoryCode: varchar("categoryCode", { length: 128 }).default("other").notNull(),
  expenseDate: timestamp("expenseDate").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 128 }),
  invoiceDate: timestamp("invoiceDate"),
  amountBeforeTax: decimal("amountBeforeTax", { precision: 18, scale: 2 }).notNull(),
  vatRate: decimal("vatRate", { precision: 7, scale: 4 }).default("0").notNull(),
  vatInput: decimal("vatInput", { precision: 18, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("dueDate"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"]).default("unpaid").notNull(),
  deductibility: mysqlEnum("deductibility", ["deductible", "non_deductible", "pending"]).default("pending").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cashTransactions = mysqlTable("cashTransactions", {
  id: int("id").autoincrement().primaryKey(),
  transactionDate: timestamp("transactionDate").notNull(),
  type: mysqlEnum("type", ["receipt", "payment"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["bank", "cash", "transfer", "other"]).default("bank").notNull(),
  accountCode: varchar("accountCode", { length: 16 }).default("1121").notNull(),
  category: varchar("category", { length: 128 }).default("other").notNull(),
  referenceType: mysqlEnum("referenceType", ["revenue", "expense", "other"]).default("other").notNull(),
  referenceId: int("referenceId"),
  matterId: int("matterId").references(() => legalMatters.id),
  documentNumber: varchar("documentNumber", { length: 128 }),
  description: text("description").notNull(),
  reconciled: boolean("reconciled").default(false).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cashAttachments = mysqlTable("cashAttachments", {
  id: int("id").autoincrement().primaryKey(),
  cashTransactionId: int("cashTransactionId").notNull().references(() => cashTransactions.id),
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 128 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
  fileSize: int("fileSize").notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const accountingPeriods = mysqlTable("accountingPeriods", {
  id: int("id").autoincrement().primaryKey(),
  periodKey: varchar("periodKey", { length: 7 }).notNull().unique(),
  status: mysqlEnum("status", ["open", "pending_approval", "rejected", "approved", "locked"]).default("open").notNull(),
  requestedBy: int("requestedBy").references(() => users.id),
  requestedAt: timestamp("requestedAt"),
  approvedBy: int("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  lockedBy: int("lockedBy").references(() => users.id),
  lockedAt: timestamp("lockedAt"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const accountingPeriodActions = mysqlTable("accountingPeriodActions", {
  id: int("id").autoincrement().primaryKey(),
  periodId: int("periodId").notNull().references(() => accountingPeriods.id),
  action: mysqlEnum("action", ["request", "approve", "reject", "lock", "reopen"]).notNull(),
  reason: text("reason"),
  actorId: int("actorId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type LegalMatter = typeof legalMatters.$inferSelect;
export type Revenue = typeof revenues.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type CashTransaction = typeof cashTransactions.$inferSelect;
export type CashAttachment = typeof cashAttachments.$inferSelect;
export type AccountingPeriod = typeof accountingPeriods.$inferSelect;
export type AccountingPeriodAction = typeof accountingPeriodActions.$inferSelect;
