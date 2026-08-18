import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  listSystemUsers: vi.fn().mockResolvedValue([{ id: 1, openId: "owner", name: "Owner", email: null, role: "admin", lastSignedIn: new Date() }]),
  setSystemUserRole: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("./_core/env", () => ({ ENV: { ownerOpenId: "owner-open-id" } }));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user", openId = role): TrpcContext {
  return {
    user: { id: role === "admin" ? 1 : 2, openId, name: role, email: null, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance.accessControl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("không cho nhân viên hoặc quản trị viên thường xem, thay đổi vai trò", async () => {
    const employee = appRouter.createCaller(context("user"));
    const administrator = appRouter.createCaller(context("admin", "non-owner-admin"));
    await expect(employee.finance.accessControl.listUsers()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(administrator.finance.accessControl.setUserRole({ userId: 3, role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cho phép chủ sở hữu phân công quản trị viên", async () => {
    const caller = appRouter.createCaller(context("admin", "owner-open-id"));
    await expect(caller.finance.accessControl.listUsers()).resolves.toHaveLength(1);
    await expect(caller.finance.accessControl.setUserRole({ userId: 3, role: "admin" })).resolves.toEqual({ success: true });
    expect(vi.mocked(db.setSystemUserRole)).toHaveBeenCalledWith(3, "admin");
  });
});
