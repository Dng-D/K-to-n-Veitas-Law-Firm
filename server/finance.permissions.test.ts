import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({ ENV: { ownerOpenId: "owner-test-user" } }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "owner" | "admin" | "staff", openId = `${role}-test-user`): TrpcContext {
  return {
    user: { id: 1, openId, name: role, email: `${role}@veritas.test`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance permissions", () => {
  it("cho phép nhân sự kế toán xem và vận hành nghiệp vụ không nhạy cảm", async () => {
    const caller = appRouter.createCaller(createContext("staff"));
    await expect(caller.finance.access()).resolves.toMatchObject({ role: "staff", isOwner: false, canView: true, canCreate: true, canEdit: true, canDelete: false, canManageAccess: false, canApprovePeriod: false });
  });

  it("chỉ chủ sở hữu có toàn bộ quyền dữ liệu và quản trị truy cập mặc định", async () => {
    const caller = appRouter.createCaller(createContext("owner", "owner-test-user"));
    await expect(caller.finance.access()).resolves.toMatchObject({ role: "owner", isOwner: true, canDelete: true, canManageAccess: true, canApprovePeriod: true, canLockPeriod: true, canApproveReportLevelOne: true, canApproveReportLevelTwo: true });
  });

  it("từ chối nhân sự xóa dữ liệu nghiệp vụ khi chưa được ủy quyền", async () => {
    const caller = appRouter.createCaller(createContext("staff"));
    await expect(caller.finance.matters.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
