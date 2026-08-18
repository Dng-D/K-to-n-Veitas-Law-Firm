import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({ ENV: { ownerOpenId: "admin-test-user" } }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: `${role}-test-user`,
      name: role === "admin" ? "Chủ sở hữu" : "Nhân viên kế toán",
      email: `${role}@veritas.test`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("finance permissions", () => {
  it("cho phép nhân viên kế toán xem và vận hành nghiệp vụ không nhạy cảm", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.finance.access()).resolves.toMatchObject({
      role: "user",
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canManageAccess: false,
    });
  });

  it("chỉ cho phép chủ sở hữu có quyền dữ liệu nhạy cảm", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.finance.access()).resolves.toMatchObject({
      role: "admin",
      canDelete: true,
      canManageAccess: true,
    });
  });

  it("từ chối nhân viên kế toán xóa dữ liệu nghiệp vụ", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.finance.matters.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
