import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getReportApprovalOverview: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "locked" }, report: null, actions: [] }),
  requestReportApproval: vi.fn().mockResolvedValue({ period: { periodKey: "2026-08", status: "locked" }, report: { status: "pending_level_1" }, actions: [] }),
  approveReportLevelOne: vi.fn().mockResolvedValue({ report: { status: "pending_level_2" } }),
  approveReportLevelTwo: vi.fn().mockResolvedValue({ report: { status: "internally_attested" } }),
  rejectReportApproval: vi.fn().mockResolvedValue({ report: { status: "rejected" } }),
  getUserAccessProfile: vi.fn().mockImplementation((user: { role: "owner" | "admin" | "staff"; openId: string }) => ({
    role: user.role,
    isOwner: false,
    permissions: user.openId === "report-admin" ? ["approve_report_level_1", "approve_report_level_2", "reject_report"] : [],
  })),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "owner" | "admin" | "staff", id: number, openId = `${role}-${id}`): TrpcContext {
  return {
    user: { id, openId, name: role, email: `${role}${id}@veritas.test`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance.reportApproval", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cho phép nhân sự lập yêu cầu phê duyệt báo cáo theo kỳ", async () => {
    const caller = appRouter.createCaller(context("staff", 11));
    await expect(caller.finance.reportApproval.request({ periodKey: "2026-08", note: "Đề nghị duyệt báo cáo" })).resolves.toMatchObject({ report: { status: "pending_level_1" } });
    expect(vi.mocked(db.requestReportApproval)).toHaveBeenCalledWith("2026-08", 11, "Đề nghị duyệt báo cáo");
  });

  it("chỉ cho phép tài khoản có thẩm quyền được ủy quyền phê duyệt hoặc từ chối hai cấp", async () => {
    const employee = appRouter.createCaller(context("staff", 11));
    await expect(employee.finance.reportApproval.approveLevelOne({ requestId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(employee.finance.reportApproval.approveLevelTwo({ requestId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(employee.finance.reportApproval.reject({ requestId: 7, reason: "Thiếu đối chiếu chứng từ" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const delegatedAdmin = appRouter.createCaller(context("admin", 12, "report-admin"));
    await delegatedAdmin.finance.reportApproval.approveLevelOne({ requestId: 7, note: "Đạt cấp 1" });
    await delegatedAdmin.finance.reportApproval.approveLevelTwo({ requestId: 7, note: "Đạt cấp 2" });
    await delegatedAdmin.finance.reportApproval.reject({ requestId: 7, reason: "Cần bổ sung chứng từ gốc" });
    expect(vi.mocked(db.approveReportLevelOne)).toHaveBeenCalledWith(7, 12, "Đạt cấp 1");
    expect(vi.mocked(db.approveReportLevelTwo)).toHaveBeenCalledWith(7, 12, "Đạt cấp 2");
    expect(vi.mocked(db.rejectReportApproval)).toHaveBeenCalledWith(7, 12, "Cần bổ sung chứng từ gốc");
  });

  it("kiểm tra định dạng kỳ và lý do từ chối", async () => {
    const employee = appRouter.createCaller(context("staff", 11));
    const delegatedAdmin = appRouter.createCaller(context("admin", 12, "report-admin"));
    await expect(employee.finance.reportApproval.overview({ periodKey: "2026/08" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(delegatedAdmin.finance.reportApproval.reject({ requestId: 7, reason: "Sai" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
