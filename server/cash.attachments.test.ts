import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getCashTransactionById: vi.fn(),
  createCashAttachment: vi.fn().mockResolvedValue({ success: true }),
  listCashAttachments: vi.fn().mockResolvedValue([]),
  createMatter: vi.fn(), createRevenue: vi.fn(), createExpense: vi.fn(), createCashTransaction: vi.fn(),
  deleteById: vi.fn(), getDashboardData: vi.fn(), listMatters: vi.fn(), listRevenues: vi.fn(), listExpenses: vi.fn(), listCashTransactions: vi.fn(),
}));
vi.mock("./storage", () => ({ storagePut: vi.fn().mockResolvedValue({ key: "cash-attachments/1/1/chung-tu.pdf", url: "/manus-storage/cash-attachments/1/1/chung-tu.pdf" }) }));

import * as db from "./db";
import { storagePut } from "./storage";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function accountingContext(): TrpcContext {
  return { user: { id: 42, openId: "attachment-tester", name: "Kế toán", email: "test@veritas.test", loginMethod: "manus", role: "staff", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("cash attachment upload", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(db.getCashTransactionById).mockResolvedValue({ id: 7 }); vi.mocked(db.createCashAttachment).mockResolvedValue({ success: true }); vi.mocked(storagePut).mockResolvedValue({ key: "cash-attachments/42/7/hoa-don.pdf", url: "/manus-storage/cash-attachments/42/7/hoa-don.pdf" }); });

  it("lưu ảnh hoặc PDF hợp lệ vào storage và metadata vào cơ sở dữ liệu", async () => {
    const caller = appRouter.createCaller(accountingContext());
    await expect(caller.finance.cash.attachments.upload({ cashTransactionId: 7, originalFileName: "hóa đơn.pdf", contentType: "application/pdf", dataBase64: Buffer.from("pdf-content").toString("base64") })).resolves.toEqual({ success: true });
    expect(storagePut).toHaveBeenCalled();
    expect(vi.mocked(db.createCashAttachment)).toHaveBeenCalledWith(expect.objectContaining({ cashTransactionId: 7, originalFileName: "hóa đơn.pdf", createdBy: 42, fileSize: 11 }));
  });

  it("từ chối loại tệp không được hỗ trợ trước khi lưu", async () => {
    const caller = appRouter.createCaller(accountingContext());
    await expect(caller.finance.cash.attachments.upload({ cashTransactionId: 7, originalFileName: "chung-tu.exe", contentType: "application/octet-stream" as never, dataBase64: "YQ==" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled();
    expect(vi.mocked(db.createCashAttachment)).not.toHaveBeenCalled();
  });
});
