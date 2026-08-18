export type ExportColumn = { label: string; value: (row: any) => string | number };
export type ExportPayload = {
  title: string;
  periodLabel: string;
  summary: Array<Array<string | number>>;
  columns: ExportColumn[];
  rows: any[];
  fileStem: string;
};

const dateTime = () => new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date());
const safeStem = (stem: string) => stem.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");

export function buildExportMatrix(payload: ExportPayload) {
  const rows: Array<Array<string | number>> = [
    ["CÔNG TY LUẬT TNHH VERITAS"],
    [payload.title],
    ["Kỳ báo cáo", payload.periodLabel],
    ["Thời điểm xuất", dateTime()],
    [],
    ["CHỈ TIÊU", "GIÁ TRỊ"],
    ...payload.summary,
    [],
    payload.columns.map(column => column.label),
    ...payload.rows.map(row => payload.columns.map(column => column.value(row))),
  ];
  return rows;
}

export async function exportExcel(payload: ExportPayload) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(buildExportMatrix(payload));
  sheet["!cols"] = payload.columns.map((column, index) => ({ wch: Math.max(index === 0 ? 24 : 16, column.label.length + 3) }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Báo cáo");
  XLSX.writeFile(workbook, `${safeStem(payload.fileStem)}.xlsx`);
}

function toDisplay(value: string | number) {
  if (typeof value === "number") return new Intl.NumberFormat("vi-VN").format(value);
  return value;
}

function trimText(ctx: CanvasRenderingContext2D, text: string, width: number) {
  if (ctx.measureText(text).width <= width) return text;
  let output = text;
  while (output.length > 1 && ctx.measureText(`${output}…`).width > width) output = output.slice(0, -1);
  return `${output}…`;
}

function renderPdfPage(payload: ExportPayload, rows: any[], pageNumber: number, totalPages: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1800;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không thể tạo bản PDF.");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#102E49";
  ctx.fillRect(0, 0, canvas.width, 110);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 30px Arial";
  ctx.fillText("CÔNG TY LUẬT TNHH VERITAS", 60, 48);
  ctx.font = "500 19px Arial";
  ctx.fillText("VERITAS FINANCE DESK", 60, 79);
  ctx.fillStyle = "#10243B";
  ctx.font = "700 34px Arial";
  ctx.fillText(payload.title, 60, 165);
  ctx.font = "400 20px Arial";
  ctx.fillStyle = "#475569";
  ctx.fillText(`Kỳ: ${payload.periodLabel}  ·  Xuất lúc: ${dateTime()}`, 60, 200);
  let y = 245;
  if (pageNumber === 1) {
    ctx.fillStyle = "#F1F5F9";
    ctx.fillRect(60, y, 1680, 82);
    ctx.fillStyle = "#334155";
    ctx.font = "700 18px Arial";
    payload.summary.slice(0, 5).forEach((entry, index) => {
      const label = String(entry[0] ?? "");
      const value = entry[1] ?? "";
      const x = 85 + index * (1640 / Math.min(payload.summary.length, 5));
      ctx.fillText(trimText(ctx, label, 220), x, y + 28);
      ctx.fillStyle = "#0F766E";
      ctx.font = "700 22px Arial";
      ctx.fillText(trimText(ctx, toDisplay(value), 220), x, y + 60);
      ctx.fillStyle = "#334155";
      ctx.font = "700 18px Arial";
    });
    y += 115;
  }
  const tableX = 60;
  const tableWidth = 1680;
  const widths = payload.columns.map((_, index) => index === 0 ? tableWidth * 0.22 : (tableWidth * 0.78) / Math.max(1, payload.columns.length - 1));
  ctx.fillStyle = "#1A5A82";
  ctx.fillRect(tableX, y, tableWidth, 43);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 16px Arial";
  let x = tableX;
  payload.columns.forEach((column, index) => { ctx.fillText(trimText(ctx, column.label, widths[index] - 20), x + 10, y + 28); x += widths[index]; });
  y += 43;
  ctx.font = "400 16px Arial";
  rows.forEach((row, rowIndex) => {
    ctx.fillStyle = rowIndex % 2 ? "#F8FAFC" : "#FFFFFF";
    ctx.fillRect(tableX, y, tableWidth, 44);
    ctx.strokeStyle = "#E2E8F0";
    ctx.strokeRect(tableX, y, tableWidth, 44);
    x = tableX;
    payload.columns.forEach((column, index) => { ctx.fillStyle = "#334155"; ctx.fillText(trimText(ctx, toDisplay(column.value(row)), widths[index] - 18), x + 9, y + 28); x += widths[index]; });
    y += 44;
  });
  ctx.fillStyle = "#64748B";
  ctx.font = "400 14px Arial";
  ctx.fillText("Tài liệu quản trị nội bộ. Cần đối chiếu chứng từ gốc trước khi kê khai hoặc quyết toán chính thức.", 60, 1155);
  ctx.fillText(`Trang ${pageNumber}/${totalPages}`, 1645, 1155);
  return canvas.toDataURL("image/png");
}

export async function exportPdf(payload: ExportPayload) {
  const { jsPDF } = await import("jspdf");
  const rowsPerPage = 16;
  const totalPages = Math.max(1, Math.ceil(payload.rows.length / rowsPerPage));
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  for (let page = 0; page < totalPages; page += 1) {
    if (page) doc.addPage("a4", "landscape");
    const image = renderPdfPage(payload, payload.rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage), page + 1, totalPages);
    doc.addImage(image, "PNG", 5, 5, 287, 191);
  }
  doc.save(`${safeStem(payload.fileStem)}.pdf`);
}
