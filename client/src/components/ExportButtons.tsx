import { Button } from "@/components/ui/button";
import { exportExcel, exportPdf, type ExportPayload } from "@/lib/financeExport";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ExportButtons({ payload }: { payload: ExportPayload }) {
  const [working, setWorking] = useState<"excel" | "pdf" | null>(null);
  async function run(kind: "excel" | "pdf") {
    try {
      setWorking(kind);
      if (kind === "excel") await exportExcel(payload); else await exportPdf(payload);
      toast.success(`Đã tạo tệp ${kind === "excel" ? "Excel" : "PDF"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xuất tệp.");
    } finally { setWorking(null); }
  }
  return <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => run("excel")} disabled={!!working}><FileSpreadsheet className="mr-2 h-4 w-4" />{working === "excel" ? "Đang tạo..." : "Xuất Excel"}</Button><Button variant="outline" onClick={() => run("pdf")} disabled={!!working}><FileText className="mr-2 h-4 w-4" />{working === "pdf" ? "Đang tạo..." : "Xuất PDF"}</Button></div>;
}
