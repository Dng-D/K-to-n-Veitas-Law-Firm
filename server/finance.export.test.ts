import { describe, expect, it } from "vitest";
import { buildExportMatrix } from "../client/src/lib/financeExport";

describe("buildExportMatrix", () => {
  it("tạo cấu trúc xuất có tiêu đề, chỉ tiêu tổng hợp và dữ liệu chi tiết", () => {
    const matrix = buildExportMatrix({
      title: "SỔ THU–CHI",
      periodLabel: "Năm 2026",
      fileStem: "veritas-test",
      summary: [["Thực thu", "100.000.000 ₫"]],
      columns: [{ label: "Ngày", value: row => row.date }, { label: "Số tiền", value: row => row.amount }],
      rows: [{ date: "18/08/2026", amount: 100000000 }],
    });

    expect(matrix[0]).toEqual(["CÔNG TY LUẬT TNHH VERITAS"]);
    expect(matrix).toContainEqual(["CHỈ TIÊU", "GIÁ TRỊ"]);
    expect(matrix).toContainEqual(["Thực thu", "100.000.000 ₫"]);
    expect(matrix).toContainEqual(["Ngày", "Số tiền"]);
    expect(matrix).toContainEqual(["18/08/2026", 100000000]);
  });
});
