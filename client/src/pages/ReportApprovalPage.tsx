import { useAuth } from "@/_core/hooks/useAuth";
import { ExportButtons } from "@/components/ExportButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, FileCheck2, FileSignature, Fingerprint, Send, ShieldCheck, ThumbsUp, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const currentPeriodKey = () => new Date().toISOString().slice(0, 7);
const periodLabel = (key: string) => new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${key}-01T12:00:00`));
const dateTime = (value?: Date | string | null) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const stageMeta: Record<string, { label: string; tone: string }> = {
  pending_level_1: { label: "Chờ phê duyệt cấp 1", tone: "badge-warning" },
  pending_level_2: { label: "Chờ phê duyệt cấp 2", tone: "badge-info" },
  rejected: { label: "Bị từ chối", tone: "badge-danger" },
  internally_attested: { label: "Đã xác nhận nội bộ", tone: "badge-success" },
};
const actionLabel: Record<string, string> = { request: "Gửi phê duyệt", approve_level_1: "Phê duyệt cấp 1", approve_level_2: "Phê duyệt cấp 2", reject: "Từ chối" };

export default function ReportApprovalPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [periodKey, setPeriodKey] = useState(currentPeriodKey);
  const overview = trpc.finance.reportApproval.overview.useQuery({ periodKey });
  const access = trpc.finance.access.useQuery();
  const report = overview.data?.report;
  const canApproveLevelOne = access.data?.canApproveReportLevelOne ?? false;
  const canApproveLevelTwo = access.data?.canApproveReportLevelTwo ?? false;
  const canRejectReport = access.data?.canRejectReport ?? false;
  const refresh = async () => {
    await Promise.all([utils.finance.reportApproval.overview.invalidate({ periodKey }), utils.finance.closing.overview.invalidate({ periodKey })]);
  };
  const request = trpc.finance.reportApproval.request.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const approveLevelOne = trpc.finance.reportApproval.approveLevelOne.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const approveLevelTwo = trpc.finance.reportApproval.approveLevelTwo.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const reject = trpc.finance.reportApproval.reject.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const working = request.isPending || approveLevelOne.isPending || approveLevelTwo.isPending || reject.isPending;
  const requireReason = (label: string) => {
    const reason = window.prompt(`${label}: vui lòng nhập lý do hoặc ghi chú vào dấu vết kiểm soát.`)?.trim();
    if (!reason) toast.error("Cần nhập nội dung để tiếp tục.");
    return reason;
  };
  const canApproveOne = Boolean(report && canApproveLevelOne && report.status === "pending_level_1" && report.requestedBy !== user?.id);
  const canApproveTwo = Boolean(report && canApproveLevelTwo && report.status === "pending_level_2" && report.requestedBy !== user?.id && report.levelOneBy !== user?.id);
  const canReject = Boolean(report && canRejectReport && (report.status === "pending_level_1" ? report.requestedBy !== user?.id : report.requestedBy !== user?.id && report.levelOneBy !== user?.id));
  const exportPayload = useMemo(() => ({
    title: "BIÊN BẢN XÁC NHẬN BÁO CÁO NỘI BỘ",
    periodLabel: periodLabel(periodKey),
    fileStem: `veritas-bien-ban-xac-nhan-${periodKey}`,
    summary: [
      ["Kỳ báo cáo", periodLabel(periodKey)],
      ["Trạng thái kỳ", overview.data?.period.status === "locked" ? "Đã khóa sổ" : "Chưa khóa sổ"],
      ["Trạng thái phê duyệt", report ? stageMeta[report.status]?.label : "Chưa có yêu cầu"],
      ["Hàm băm SHA-256", report?.reportHash || "—"],
      ["Người lập", report?.requestedBy ? `Tài khoản #${report.requestedBy}` : "—"],
      ["Cấp 1", report?.levelOneBy ? `Tài khoản #${report.levelOneBy}` : "Chưa phê duyệt"],
      ["Cấp 2", report?.levelTwoBy ? `Tài khoản #${report.levelTwoBy}` : "Chưa phê duyệt"],
      ["Lưu ý", "Hồ sơ xác nhận nội bộ; không phải chữ ký số bằng chứng thư."],
    ],
    columns: [
      { label: "Thời điểm", value: (row: any) => dateTime(row.createdAt) },
      { label: "Thao tác", value: (row: any) => actionLabel[row.action] || row.action },
      { label: "Người thực hiện", value: (row: any) => row.actorName || `Tài khoản #${row.actorId}` },
      { label: "Ghi chú / lý do", value: (row: any) => row.reason || "—" },
    ],
    rows: overview.data?.actions ?? [],
  }), [overview.data, periodKey, report]);

  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="eyebrow">XÁC NHẬN NỘI BỘ · HAI CẤP</p><h1 className="page-title">Phê duyệt báo cáo</h1><p className="page-description">Tạo dấu vết xác nhận hai cấp và hàm băm của phiên bản báo cáo đã khóa sổ; không thay thế chữ ký số có chứng thư.</p></div><div className="flex flex-wrap gap-2"><ExportButtons payload={exportPayload} /><div className="w-full sm:w-44"><Label className="sr-only" htmlFor="approval-period">Chọn tháng</Label><Input id="approval-period" type="month" value={periodKey} onChange={event => setPeriodKey(event.target.value || currentPeriodKey())} /></div></div></div>
    {overview.isLoading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-56 animate-pulse rounded-2xl bg-slate-200" /><div className="h-56 animate-pulse rounded-2xl bg-slate-200" /></div> : <>
      {overview.data?.period.status !== "locked" ? <Card className="border-amber-200 bg-amber-50"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-semibold text-amber-950">Cần khóa sổ tháng trước khi phê duyệt báo cáo</p><p className="mt-1 text-sm leading-6 text-amber-900">Hệ thống chỉ tạo hồ sơ xác nhận hai cấp cho phiên bản báo cáo của kỳ đã khóa nhằm hạn chế thay đổi sau xác nhận.</p></div></div><Button asChild variant="outline" className="border-amber-300 bg-white"><Link href="/ky-ke-toan">Mở khóa sổ</Link></Button></CardContent></Card> : <>
        <Card className="panel-card overflow-hidden"><CardContent className="p-0"><div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]"><div className="p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">BÁO CÁO KỲ ĐÃ KHÓA</p><h2 className="font-serif text-2xl font-semibold capitalize text-slate-900">{periodLabel(periodKey)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Khi gửi yêu cầu, hệ thống tạo hàm băm SHA-256 của ảnh chụp báo cáo đối chiếu để phát hiện thay đổi dữ liệu trong phiên bản này.</p></div>{report ? <Badge className={stageMeta[report.status]?.tone}>{stageMeta[report.status]?.label}</Badge> : <Badge className="badge-neutral">Chưa gửi</Badge>}</div><div className="mt-6 flex flex-wrap gap-2">{!report || report.status === "rejected" ? <Button disabled={working} onClick={() => request.mutate({ periodKey })}><Send className="mr-2 h-4 w-4" />Gửi phê duyệt cấp 1</Button> : null}{canApproveOne && <Button disabled={working} onClick={() => approveLevelOne.mutate({ requestId: report!.id, note: "Chấp thuận cấp 1" })}><ThumbsUp className="mr-2 h-4 w-4" />Phê duyệt cấp 1</Button>}{canApproveTwo && <Button disabled={working} onClick={() => approveLevelTwo.mutate({ requestId: report!.id, note: "Chấp thuận cấp 2" })}><CheckCircle2 className="mr-2 h-4 w-4" />Xác nhận cấp 2</Button>}{canReject && <Button disabled={working} variant="outline" onClick={() => { const reason = requireReason("Từ chối báo cáo"); if (reason) reject.mutate({ requestId: report!.id, reason }); }}><XCircle className="mr-2 h-4 w-4" />Từ chối</Button>}</div>{report?.status === "pending_level_1" && report.requestedBy === user?.id && <p className="mt-4 text-sm leading-6 text-amber-800">Ông là người lập yêu cầu. Một quản trị viên khác cần xử lý phê duyệt cấp 1.</p>}{report?.status === "pending_level_2" && (report.requestedBy === user?.id || report.levelOneBy === user?.id) && <p className="mt-4 text-sm leading-6 text-amber-800">Cấp 2 phải là một quản trị viên khác người lập và người phê duyệt cấp 1.</p>}</div><div className="border-t border-slate-100 bg-slate-50 p-6 lg:border-l lg:border-t-0"><div className="flex items-start gap-3"><div className="rounded-xl bg-teal-50 p-2 text-teal-700"><Fingerprint className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-slate-800">Bằng chứng phiên bản</p><p className="mt-1 text-xs leading-5 text-slate-500">Mã băm cho ảnh chụp báo cáo đã gửi phê duyệt.</p></div></div><code className="mt-4 block break-all rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700">{report?.reportHash || "Chưa tạo hàm băm"}</code><p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />Hồ sơ này là xác nhận nội bộ có kiểm soát. Tích hợp chứng thư số sẽ cần nhà cung cấp riêng.</p></div></div></CardContent></Card>
        <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"><Card className="panel-card"><CardContent className="p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-navy-50 p-2 text-[#1A5A82]"><FileSignature className="h-5 w-5" /></div><div><p className="panel-title">Nguyên tắc hai cấp</p><p className="panel-subtitle">Phân tách người lập và từng cấp phê duyệt.</p></div></div><div className="mt-5 space-y-4 text-sm leading-6 text-slate-600"><p><strong className="text-slate-800">Người lập:</strong> gửi phiên bản báo cáo sau khi kỳ đã khóa.</p><p><strong className="text-slate-800">Cấp 1:</strong> tài khoản được chủ sở hữu ủy quyền cấp 1 và khác người lập.</p><p><strong className="text-slate-800">Cấp 2:</strong> tài khoản được ủy quyền cấp 2, không trùng người lập/cấp 1.</p><p><strong className="text-slate-800">Biên bản:</strong> xuất PDF/Excel để lưu bằng chứng cùng hồ sơ nội bộ.</p></div></CardContent></Card><Card className="panel-card"><CardContent className="p-5"><p className="panel-title">Dấu vết phê duyệt</p><p className="panel-subtitle">Toàn bộ thao tác được ghi theo thứ tự thời gian.</p><div className="mt-5 space-y-3">{overview.data?.actions.length ? overview.data.actions.map(action => <div key={action.id} className="rounded-xl border border-slate-100 px-3 py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-800">{actionLabel[action.action] || action.action}</p><span className="text-xs text-slate-500">{dateTime(action.createdAt)}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{action.actorName || `Tài khoản #${action.actorId}`}{action.reason ? ` · ${action.reason}` : ""}</p></div>) : <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Chưa có yêu cầu phê duyệt nào cho phiên bản báo cáo này.</div>}</div></CardContent></Card></div>
      </>}
    </>}
  </>;
}
