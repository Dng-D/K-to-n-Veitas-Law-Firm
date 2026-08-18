import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getReportApprovalOverview: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "locked" }, report: null, actions: [] }),
  requestReportApproval: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "locked" }, report: { status: "pending_level_1" }, actions: [] }),
  approveReportLevelOne: vi.fn().mockResolvedValue({ report: { status: "pending_level_2" } }),
  approveReportLevelTwo: vi.fn().mockResolvedValue({ report: { status: "internally_attested" } }),
  rejectReportApproval: vi.fn().mockResolvedValue({ report: { status: "rejected" } }),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user", id: number): TrpcContext {
  return {
    user: { id, openId: `${role}-${id}`, name: role, email: `${role}${id}@veritas.test`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance.reportApproval", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cho phép người lập gửi yêu cầu phê duyệt báo cáo theo kỳ", async () => {
    const caller = appRouter.createCaller(context("user", 11));
    await expect(caller.finance.reportApproval.request({ periodKey: "2026-08", note: "Đề nghị duyệt báo cáo" })).resolves.toMatchObject({ report: { status: "pending_level_1" } });
    expect(vi.mocked(db.requestReportApproval)).toHaveBeenCalledWith("2026-08", 11, "Đề nghị duyệt báo cáo");
  });

  it("chỉ cho phép quản trị viên phê duyệt hoặc từ chối hai cấp", async () => {
    const employee = appRouter.createCaller(context("user", 11));
    await expect(employee.finance.reportApproval.approveLevelOne({ requestId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(employee.finance.reportApproval.approveLevelTwo({ requestId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(employee.finance.reportApproval.reject({ requestId: 7, reason: "Thiếu đối chiếu chứng từ" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const admin = appRouter.createCaller(context("admin", 12));
    await admin.finance.reportApproval.approveLevelOne({ requestId: 7, note: "Đạt cấp 1" });
    await admin.finance.reportApproval.approveLevelTwo({ requestId: 7, note: "Đạt cấp 2" });
    expect(vi.mocked(db.approveReportLevelOne)).toHaveBeenCalledWith(7, 12, "Đạt cấp 1");
    expect(vi.mocked(db.approveReportLevelTwo)).toHaveBeenCalledWith(7, 12, "Đạt cấp 2");
  });

  it("kiểm tra định dạng kỳ và lý do từ chối", async () => {
    const employee = appRouter.createCaller(context("user", 11));
    const admin = appRouter.createCaller(context("admin", 12));
    await expect(employee.finance.reportApproval.overview({ periodKey: "2026/08" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(admin.finance.reportApproval.reject({ requestId: 7, reason: "Sai" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
