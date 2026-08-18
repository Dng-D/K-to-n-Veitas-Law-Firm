import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  listAccessDirectory: vi.fn().mockResolvedValue([{ id: 1, openId: "owner-open-id", name: "Chủ sở hữu", email: "owner@veritas.test", role: "owner", permissions: [], lastSignedIn: new Date() }]),
  inviteUserByEmail: vi.fn().mockResolvedValue({ success: true, invitation: { id: 4, email: "ke.toan@veritas.test" } }),
  setUserAccessProfile: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("./_core/env", () => ({ ENV: { ownerOpenId: "owner-open-id" } }));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "owner" | "admin" | "staff", openId = role): TrpcContext {
  return {
    user: { id: role === "owner" ? 1 : 2, openId, name: role, email: `${role}@veritas.test`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance.accessControl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("không cho nhân sự hoặc quản trị viên tự quản lý danh mục quyền", async () => {
    const employee = appRouter.createCaller(context("staff"));
    const administrator = appRouter.createCaller(context("admin", "delegated-admin"));
    await expect(employee.finance.accessControl.directory()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(administrator.finance.accessControl.inviteByEmail({ email: "ke.toan@veritas.test", role: "staff", permissions: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(administrator.finance.accessControl.setUserAccess({ userId: 3, role: "admin", permissions: ["approve_month_close"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cho phép chủ sở hữu mời bằng email và ủy quyền cụ thể cho quản trị viên", async () => {
    const caller = appRouter.createCaller(context("owner", "owner-open-id"));
    const expiresAt = Date.UTC(2026, 11, 31, 16, 59, 59);
    await expect(caller.finance.accessControl.directory()).resolves.toHaveLength(1);
    await expect(caller.finance.accessControl.inviteByEmail({ email: "ke.toan@veritas.test", role: "admin", permissions: ["approve_month_close", "lock_month_close"], expiresAt, permissionExpiries: [{ permission: "approve_month_close", expiresAt }, { permission: "lock_month_close", expiresAt: null }] })).resolves.toMatchObject({ success: true });
    await expect(caller.finance.accessControl.setUserAccess({ userId: 3, role: "admin", permissions: ["approve_report_level_1"], expiresAt })).resolves.toEqual({ success: true });
    expect(vi.mocked(db.inviteUserByEmail)).toHaveBeenCalledWith({ email: "ke.toan@veritas.test", role: "admin", permissions: ["approve_month_close", "lock_month_close"], expiresAt: new Date(expiresAt), permissionExpiries: { approve_month_close: new Date(expiresAt), lock_month_close: null }, actorId: 1 });
    expect(vi.mocked(db.setUserAccessProfile)).toHaveBeenCalledWith({ userId: 3, role: "admin", permissions: ["approve_report_level_1"], expiresAt: new Date(expiresAt), permissionExpiries: {}, actorId: 1 });
  });

  it("chỉ nhận thời hạn hợp lệ là thời điểm Unix dương", async () => {
    const caller = appRouter.createCaller(context("owner", "owner-open-id"));
    await expect(caller.finance.accessControl.inviteByEmail({ email: "ke.toan@veritas.test", role: "admin", permissions: [], expiresAt: -1 })).rejects.toBeTruthy();
  });
});
