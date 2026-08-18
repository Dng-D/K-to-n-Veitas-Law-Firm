import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createMatter: vi.fn().mockResolvedValue({ success: true }),
  createRevenue: vi.fn().mockResolvedValue({ success: true }),
  createExpense: vi.fn().mockResolvedValue({ success: true }),
  createCashTransaction: vi.fn().mockResolvedValue({ success: true }),
  deleteById: vi.fn(),
  getDashboardData: vi.fn(),
  listMatters: vi.fn(),
  listRevenues: vi.fn(),
  listExpenses: vi.fn(),
  listCashTransactions: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function accountingContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "accountant-test-user",
      name: "Kế toán thử nghiệm",
      email: "accountant@veritas.test",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance create mutations", () => {
  const timestamp = new Date("2026-08-18T12:00:00Z").getTime();

  beforeEach(() => vi.clearAllMocks());

  it("cho phép kế toán tạo hồ sơ và gắn người tạo", async () => {
    const caller = appRouter.createCaller(accountingContext());
    await expect(caller.finance.matters.create({
      code: "HS-2026-001", title: "Tư vấn hợp đồng", clientName: "Khách hàng A", serviceType: "Tư vấn pháp lý",
      lawyerName: "Luật sư Veritas", contractValue: 100000000, status: "active",
    })).resolves.toEqual({ success: true });
    expect(vi.mocked(db.createMatter)).toHaveBeenCalledWith(expect.objectContaining({
      code: "HS-2026-001", createdBy: 42, contractValue: 100000000,
    }));
  });

  it("tạo doanh thu, chi phí và thực thu/thực chi với tham số hợp lệ", async () => {
    const caller = appRouter.createCaller(accountingContext());
    await caller.finance.revenues.create({ matterId: 1, serviceDate: timestamp, amountBeforeTax: 100000000, vatRate: 0.1, collectedAmount: 0 });
    await caller.finance.expenses.create({ matterId: 1, supplierName: "Nhà cung cấp A", category: "Công nghệ", expenseDate: timestamp, amountBeforeTax: 10000000, vatRate: 0.1, paidAmount: 0, deductibility: "deductible" });
    await caller.finance.cash.create({ transactionDate: timestamp, type: "receipt", amount: 50000000, paymentMethod: "bank", referenceType: "revenue", matterId: 1, description: "Thu phí dịch vụ", reconciled: true });

    expect(vi.mocked(db.createRevenue)).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 42, amountBeforeTax: 100000000, vatRate: 0.1 }));
    expect(vi.mocked(db.createExpense)).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 42, supplierName: "Nhà cung cấp A", deductibility: "deductible" }));
    expect(vi.mocked(db.createCashTransaction)).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 42, type: "receipt", reconciled: true }));
  });

  it("từ chối dữ liệu doanh thu không hợp lệ trước khi ghi nhận", async () => {
    const caller = appRouter.createCaller(accountingContext());
    await expect(caller.finance.revenues.create({
      serviceDate: timestamp, amountBeforeTax: 0, vatRate: 1.5, collectedAmount: -1,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(vi.mocked(db.createRevenue)).not.toHaveBeenCalled();
  });

  it("từ chối dữ liệu hồ sơ, chi phí và thu–chi không hợp lệ trước khi ghi nhận", async () => {
    const caller = appRouter.createCaller(accountingContext());
    await expect(caller.finance.matters.create({
      code: "A", title: "X", clientName: "K", serviceType: "X", lawyerName: "L", contractValue: -1, status: "draft",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.expenses.create({
      supplierName: "", category: "X", expenseDate: timestamp, amountBeforeTax: -10, vatRate: 1.2, paidAmount: -1, deductibility: "pending",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.cash.create({
      transactionDate: timestamp, type: "payment", amount: 0, paymentMethod: "bank", referenceType: "other", description: "x", reconciled: false,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(vi.mocked(db.createMatter)).not.toHaveBeenCalled();
    expect(vi.mocked(db.createExpense)).not.toHaveBeenCalled();
    expect(vi.mocked(db.createCashTransaction)).not.toHaveBeenCalled();
  });
});
