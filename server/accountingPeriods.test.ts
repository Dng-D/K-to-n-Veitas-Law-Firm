import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getAccountingPeriodOverview: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "open" }, actions: [], control: { isReadyForApproval: true } }),
  requestPeriodApproval: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "pending_approval" } }),
  approvePeriod: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "approved" } }),
  rejectPeriod: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "rejected" } }),
  lockPeriod: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "locked" } }),
  reopenPeriod: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "open" } }),
  getReconciliationReport: vi.fn().mockResolvedValue({ periodKey: "2026-08", status: "open", control: {}, rows: [] }),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: role === "admin" ? 7 : 8, openId: `${role}-period-test`, name: role, email: `${role}@veritas.test`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance.closing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cho phép kế toán gửi yêu cầu phê duyệt cho kỳ hợp lệ", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.finance.closing.request({ periodKey: "2026-08", note: "Đã hoàn tất đối chiếu" })).resolves.toMatchObject({ period: { status: "pending_approval" } });
    expect(vi.mocked(db.requestPeriodApproval)).toHaveBeenCalledWith("2026-08", 8, "Đã hoàn tất đối chiếu");
  });

  it("chỉ cho phép quản trị viên phê duyệt và khóa sổ", async () => {
    const accountant = appRouter.createCaller(context("user"));
    await expect(accountant.finance.closing.approve({ periodKey: "2026-08" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(accountant.finance.closing.lock({ periodKey: "2026-08" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const owner = appRouter.createCaller(context("admin"));
    await owner.finance.closing.approve({ periodKey: "2026-08", note: "Chấp thuận" });
    await owner.finance.closing.lock({ periodKey: "2026-08", note: "Khóa sổ tháng" });
    expect(vi.mocked(db.approvePeriod)).toHaveBeenCalledWith("2026-08", 7, "Chấp thuận");
    expect(vi.mocked(db.lockPeriod)).toHaveBeenCalledWith("2026-08", 7, "Khóa sổ tháng");
  });

  it("từ chối kỳ không đúng định dạng và lý do mở lại/từ chối quá ngắn", async () => {
    const owner = appRouter.createCaller(context("admin"));
    await expect(owner.finance.closing.overview({ periodKey: "08-2026" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(owner.finance.closing.reject({ periodKey: "2026-08", reason: "Sai" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(owner.finance.closing.reopen({ periodKey: "2026-08", reason: "Mở" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
