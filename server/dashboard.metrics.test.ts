import { describe, expect, it } from "vitest";
import { calculateDashboardMetrics } from "./db";

describe("calculateDashboardMetrics", () => {
  it("tổng hợp chính xác KPI doanh thu, dòng tiền, công nợ và lợi nhuận", () => {
    const data = calculateDashboardMetrics({
      matterRows: [{ status: "active" }, { status: "completed" }],
      revenueRows: [
        { status: "collected", serviceDate: new Date("2026-01-10"), updatedAt: new Date("2026-01-10"), amountBeforeTax: "100000000", totalAmount: "110000000", collectedAmount: "110000000" },
        { status: "overdue", serviceDate: new Date("2026-02-10"), updatedAt: new Date("2026-02-10"), amountBeforeTax: "50000000", totalAmount: "55000000", collectedAmount: "15000000" },
        { status: "void", serviceDate: new Date("2026-02-11"), updatedAt: new Date("2026-02-11"), amountBeforeTax: "999999999", totalAmount: "999999999", collectedAmount: "0" },
      ],
      expenseRows: [
        { expenseDate: new Date("2026-01-15"), updatedAt: new Date("2026-01-15"), amountBeforeTax: "30000000", totalAmount: "33000000", paidAmount: "20000000" },
      ],
      cashRows: [
        { transactionDate: new Date("2026-01-11"), updatedAt: new Date("2026-01-11"), type: "receipt", amount: "110000000" },
        { transactionDate: new Date("2026-01-16"), updatedAt: new Date("2026-01-16"), type: "payment", amount: "20000000" },
      ],
    });

    expect(data.kpis).toEqual({ totalRevenue: 150000000, actualReceipts: 110000000, actualPayments: 20000000, profit: 120000000, receivable: 40000000, payable: 13000000 });
    expect(data.counts).toEqual({ matters: 2, activeMatters: 1, overdueRevenue: 1 });
    expect(data.monthly).toEqual([{ month: "2026-01", revenue: 100000000, expense: 30000000, cashFlow: 90000000 }, { month: "2026-02", revenue: 50000000, expense: 0, cashFlow: 0 }]);
  });
});
