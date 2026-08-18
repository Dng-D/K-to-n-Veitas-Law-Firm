import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getAccountingPeriodOverview: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "open" }, actions: [], control: { isReadyForApproval: true } }),
  requestPeriodApproval: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "pending_approval" } }),
  approvePeriod: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "approved" } }),
  rejectPeriod: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "rejected" } }),
  lockPeriod: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "locked" } }),
  reopenPeriod: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "open" } }),
  getReconciliationReport: vi.fn().mockResolvedValue({ periodKey: "2026-08", status: "open", control: {}, rows: [] }),
  getUserAccessProfile: vi.fn().mockImplementation((user: { role: "owner" | "admin" | "staff"; openId: string }) => ({
    role: user.role,
    isOwner: user.openId === "owner-period-test",
    permissions: user.openId === "period-admin" ? ["approve_month_close", "lock_month_close", "reopen_month_close"] : [],
  })),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "owner" | "admin" | "staff", openId = `${role}-period-test`): TrpcContext {
  return {
    user: { id: role === "admin" ? 7 : 8, openId, name: role, email: `${role}@veritas.test`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance.closing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cho phép nhân sự kế toán gửi yêu cầu phê duyệt cho kỳ hợp lệ", async () => {
    const caller = appRouter.createCaller(context("staff"));
    await expect(caller.finance.closing.request({ periodKey: "2026-08", note: "Đã hoàn tất đối chiếu" })).resolves.toMatchObject({ period: { status: "pending_approval" } });
    expect(vi.mocked(db.requestPeriodApproval)).toHaveBeenCalledWith("2026-08", 8, "Đã hoàn tất đối chiếu");
  });

  it("chỉ cho phép tài khoản có quyền được ủy quyền phê duyệt, khóa và mở lại kỳ", async () => {
    const accountant = appRouter.createCaller(context("staff"));
    await expect(accountant.finance.closing.approve({ periodKey: "2026-08" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(accountant.finance.closing.lock({ periodKey: "2026-08" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const delegatedAdmin = appRouter.createCaller(context("admin", "period-admin"));
    await delegatedAdmin.finance.closing.approve({ periodKey: "2026-08", note: "Chấp thuận" });
    await delegatedAdmin.finance.closing.lock({ periodKey: "2026-08", note: "Khóa sổ tháng" });
    await delegatedAdmin.finance.closing.reopen({ periodKey: "2026-08", reason: "Cần điều chỉnh chứng từ" });
    expect(vi.mocked(db.approvePeriod)).toHaveBeenCalledWith("2026-08", 7, "Chấp thuận");
    expect(vi.mocked(db.lockPeriod)).toHaveBeenCalledWith("2026-08", 7, "Khóa sổ tháng");
    expect(vi.mocked(db.reopenPeriod)).toHaveBeenCalledWith("2026-08", 7, "Cần điều chỉnh chứng từ");
  });

  it("từ chối kỳ không đúng định dạng và lý do mở lại/từ chối quá ngắn", async () => {
    const delegatedAdmin = appRouter.createCaller(context("admin", "period-admin"));
    await expect(delegatedAdmin.finance.closing.overview({ periodKey: "08-2026" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(delegatedAdmin.finance.closing.reject({ periodKey: "2026-08", reason: "Sai" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(delegatedAdmin.finance.closing.reopen({ periodKey: "2026-08", reason: "Mở" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
