import { useAuth } from "@/_core/hooks/useAuth";
import { ExportButtons } from "@/components/ExportButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileCheck2, FileText, LockKeyhole, Send, ShieldCheck, ThumbsUp, Undo2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const money = (value: string | number | null | undefined) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
const dateTime = (value?: Date | string | null) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const currentPeriodKey = () => new Date().toISOString().slice(0, 7);
const formatPeriod = (key: string) => new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${key}-01T12:00:00`));

const statusMeta: Record<string, { label: string; tone: string }> = {
  open: { label: "Đang mở", tone: "badge-info" },
  pending_approval: { label: "Chờ phê duyệt", tone: "badge-warning" },
  rejected: { label: "Bị từ chối", tone: "badge-danger" },
  approved: { label: "Đã phê duyệt", tone: "badge-success" },
  locked: { label: "Đã khóa sổ", tone: "badge-neutral" },
};

const actionLabel: Record<string, string> = { request: "Gửi phê duyệt", approve: "Phê duyệt", reject: "Từ chối", lock: "Khóa sổ", reopen: "Mở lại kỳ" };

export default function PeriodClosePage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [periodKey, setPeriodKey] = useState(currentPeriodKey);
  const overview = trpc.finance.closing.overview.useQuery({ periodKey });
  const report = trpc.finance.reconciliationReport.useQuery({ periodKey });
  const status = overview.data?.period.status ?? "open";
  const control = overview.data?.control;
  const isAdmin = user?.role === "admin";
  const isRequester = overview.data?.period.requestedBy === user?.id;
  const refresh = async () => {
    await Promise.all([
      utils.finance.closing.overview.invalidate({ periodKey }),
      utils.finance.reconciliationReport.invalidate({ periodKey }),
      utils.finance.dashboard.invalidate(),
      utils.finance.cash.list.invalidate(),
      utils.finance.revenues.list.invalidate(),
      utils.finance.expenses.list.invalidate(),
    ]);
  };
  const request = trpc.finance.closing.request.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const approve = trpc.finance.closing.approve.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const reject = trpc.finance.closing.reject.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const lock = trpc.finance.closing.lock.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const reopen = trpc.finance.closing.reopen.useMutation({ onSuccess: refresh, onError: error => toast.error(error.message) });
  const working = request.isPending || approve.isPending || reject.isPending || lock.isPending || reopen.isPending;

  const exportPayload = useMemo(() => ({
    title: "BÁO CÁO ĐỐI CHIẾU CHỨNG TỪ VÀ SỔ SÁCH",
    periodLabel: formatPeriod(periodKey),
    fileStem: `veritas-doi-chieu-${periodKey}`,
    summary: [
      ["Trạng thái kỳ", statusMeta[status]?.label ?? status],
      ["Số đã ghi nhận thực thu", money(control?.declaredReceipts)],
      ["Nhật ký thực thu", money(control?.cashReceipts)],
      ["Chênh lệch thực thu", money(control?.receiptDifference)],
      ["Số đã ghi nhận thực chi", money(control?.declaredPayments)],
      ["Nhật ký thực chi", money(control?.cashPayments)],
      ["Chênh lệch thực chi", money(control?.paymentDifference)],
      ["Chứng từ thiếu số", control?.missingDocumentCount ?? 0],
      ["Giao dịch chưa đối chiếu", control?.unreconciledCashCount ?? 0],
    ],
    columns: [
      { label: "Ngày", value: (row: any) => new Intl.DateTimeFormat("vi-VN").format(new Date(row.transactionDate)) },
      { label: "Số chứng từ", value: (row: any) => row.documentNumber || "Thiếu số chứng từ" },
      { label: "Loại", value: (row: any) => row.type === "receipt" ? "Thực thu" : "Thực chi" },
      { label: "Diễn giải", value: (row: any) => row.description },
      { label: "Hồ sơ", value: (row: any) => row.matterCode || "—" },
      { label: "Số tiền", value: (row: any) => money(row.amount) },
      { label: "Đối chiếu", value: (row: any) => row.reconciled ? "Đã đối chiếu" : "Chưa đối chiếu" },
      { label: "Tệp chứng từ", value: (row: any) => row.attachmentCount ? `${row.attachmentCount} tệp` : "Chưa đính kèm" },
    ],
    rows: report.data?.rows ?? [],
  }), [control, periodKey, report.data?.rows, status]);

  const requireReason = (label: string) => {
    const reason = window.prompt(`${label}: vui lòng nhập lý do để ghi vào nhật ký kiểm soát.`)?.trim();
    if (!reason) toast.error("Cần nhập lý do để tiếp tục.");
    return reason;
  };

  const stateAction = () => {
    if (status === "open" || status === "rejected") request.mutate({ periodKey });
    if (status === "pending_approval" && isAdmin) approve.mutate({ periodKey });
    if (status === "approved" && isAdmin) lock.mutate({ periodKey });
    if (status === "locked" && isAdmin) {
      const reason = requireReason("Mở lại kỳ");
      if (reason) reopen.mutate({ periodKey, reason });
    }
  };
  const primaryLabel = status === "open" || status === "rejected" ? "Gửi phê duyệt" : status === "pending_approval" && isRequester ? "Chờ người phê duyệt khác" : status === "pending_approval" ? "Phê duyệt kỳ" : status === "approved" ? "Khóa sổ tháng" : "Mở lại kỳ";
  const PrimaryIcon = status === "open" || status === "rejected" ? Send : status === "pending_approval" ? ThumbsUp : status === "approved" ? LockKeyhole : Undo2;
  const meta = statusMeta[status] ?? statusMeta.open;
  const checks = [
    { label: "Đối chiếu thực thu", detail: `Chênh lệch ${money(control?.receiptDifference)}`, ok: (control?.receiptDifference ?? 0) === 0 },
    { label: "Đối chiếu thực chi", detail: `Chênh lệch ${money(control?.paymentDifference)}`, ok: (control?.paymentDifference ?? 0) === 0 },
    { label: "Phân loại nghiệp vụ", detail: `${control?.otherReferenceCount ?? 0} giao dịch chờ phân loại`, ok: (control?.otherReferenceCount ?? 0) === 0 },
    { label: "Đối chiếu sao kê / sổ quỹ", detail: `${control?.unreconciledCashCount ?? 0} giao dịch chưa đối chiếu`, ok: (control?.unreconciledCashCount ?? 0) === 0 },
    { label: "Số chứng từ", detail: `${control?.missingDocumentCount ?? 0} giao dịch thiếu số chứng từ`, ok: (control?.missingDocumentCount ?? 0) === 0 },
  ];

  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="eyebrow">KIỂM SOÁT NỘI BỘ · KHÓA SỔ THÁNG</p><h1 className="page-title">Phê duyệt và khóa sổ</h1><p className="page-description">Đối chiếu các điều kiện bắt buộc, tạo dấu vết phê duyệt và khóa dữ liệu sau khi quản trị viên chấp thuận.</p></div><div className="flex flex-wrap gap-2"><ExportButtons payload={exportPayload} /><div className="w-full sm:w-44"><Label className="sr-only" htmlFor="period-key">Chọn tháng</Label><Input id="period-key" type="month" value={periodKey} onChange={event => setPeriodKey(event.target.value || currentPeriodKey())} /></div></div></div>
    {overview.isLoading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-52 animate-pulse rounded-2xl bg-slate-200" /><div className="h-52 animate-pulse rounded-2xl bg-slate-200" /></div> : <>
      <Card className="panel-card overflow-hidden"><CardContent className="p-0"><div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]"><div className="p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">KỲ ĐANG CHỌN</p><h2 className="font-serif text-2xl font-semibold capitalize text-slate-900">{formatPeriod(periodKey)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Kỳ chỉ được khóa sau khi hệ thống không còn chênh lệch liên sổ, giao dịch chờ đối chiếu hoặc thiếu số chứng từ.</p></div><Badge className={meta.tone}>{meta.label}</Badge></div><div className="mt-6 flex flex-wrap gap-2"><Button disabled={working || ((status === "open" || status === "rejected") && !control?.isReadyForApproval) || (status === "pending_approval" && (!isAdmin || isRequester)) || (status === "approved" && !isAdmin) || (status === "locked" && !isAdmin)} onClick={stateAction}><PrimaryIcon className="mr-2 h-4 w-4" />{working ? "Đang xử lý..." : primaryLabel}</Button>{status === "pending_approval" && isAdmin && !isRequester && <Button variant="outline" disabled={working} onClick={() => { const reason = requireReason("Từ chối kỳ"); if (reason) reject.mutate({ periodKey, reason }); }}><XCircle className="mr-2 h-4 w-4" />Từ chối</Button>}</div>{status === "pending_approval" && isRequester && <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Ông là người gửi yêu cầu này. Một quản trị viên khác cần phê duyệt hoặc từ chối để bảo đảm phân tách nhiệm vụ.</p>}{(status === "open" || status === "rejected") && !control?.isReadyForApproval && <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Hệ thống đang chặn gửi phê duyệt cho đến khi tất cả điều kiện đối chiếu ở bên phải đạt yêu cầu.</p>}</div><div className="border-t border-slate-100 bg-slate-50 p-6 lg:border-l lg:border-t-0"><p className="text-sm font-semibold text-slate-800">Dấu vết kiểm soát</p><div className="mt-4 space-y-3">{overview.data?.actions.length ? overview.data.actions.slice(0, 5).map(action => <div key={action.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-800">{actionLabel[action.action] || action.action}</span><span className="text-xs text-slate-500">{dateTime(action.createdAt)}</span></div><p className="mt-1 text-xs text-slate-500">{action.actorName || `Tài khoản #${action.actorId}`}{action.reason ? ` · ${action.reason}` : ""}</p></div>) : <p className="text-sm leading-6 text-slate-500">Chưa có thao tác nào được ghi nhận cho kỳ này.</p>}</div></div></div></CardContent></Card>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr]"><Card className="panel-card"><CardContent className="p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-teal-50 p-2 text-teal-700"><ClipboardCheck className="h-5 w-5" /></div><div><p className="panel-title">Điều kiện gửi phê duyệt</p><p className="panel-subtitle">Mọi điều kiện phải đạt trước khi người lập có thể gửi kỳ.</p></div></div><div className="mt-5 space-y-3">{checks.map(check => <div key={check.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3"><div className="flex min-w-0 items-center gap-3">{check.ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}<div><p className="text-sm font-medium text-slate-800">{check.label}</p><p className="mt-0.5 text-xs text-slate-500">{check.detail}</p></div></div><span className={`text-xs font-semibold ${check.ok ? "text-teal-700" : "text-amber-700"}`}>{check.ok ? "Đạt" : "Cần xử lý"}</span></div>)}</div></CardContent></Card><Card className="panel-card"><CardContent className="p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-navy-50 p-2 text-[#1A5A82]"><ShieldCheck className="h-5 w-5" /></div><div><p className="panel-title">Phân tách nhiệm vụ</p><p className="panel-subtitle">Luồng xử lý được thiết kế để hạn chế sửa đổi sau phê duyệt.</p></div></div><div className="mt-5 space-y-4 text-sm leading-6 text-slate-600"><p><strong className="text-slate-800">Người lập:</strong> gửi yêu cầu sau khi xử lý toàn bộ điều kiện đối chiếu.</p><p><strong className="text-slate-800">Quản trị viên:</strong> phê duyệt, từ chối, khóa hoặc mở lại kỳ có ghi nhận lý do.</p><p><strong className="text-slate-800">Kỳ đã khóa:</strong> chặn tạo, sửa, xóa và đính kèm chứng từ thuộc tháng đó.</p></div></CardContent></Card></div>
      <Card className="panel-card mt-6 overflow-hidden"><CardContent className="p-0"><div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="panel-title">Danh mục chứng từ cần đối chiếu</p><p className="panel-subtitle">Tải Excel hoặc PDF từ nút xuất phía trên để lưu hồ sơ kiểm soát theo kỳ.</p></div><Badge className={control?.isReadyForApproval ? "badge-success" : "badge-warning"}>{control?.isReadyForApproval ? "Sẵn sàng phê duyệt" : "Cần hoàn thiện"}</Badge></div><div className="table-wrap"><Table><TableHeader><TableRow><TableHead>Ngày</TableHead><TableHead>Số chứng từ</TableHead><TableHead>Diễn giải / hồ sơ</TableHead><TableHead>Loại</TableHead><TableHead className="text-right">Số tiền</TableHead><TableHead>Đối chiếu</TableHead><TableHead>Tệp</TableHead></TableRow></TableHeader><TableBody>{report.data?.rows.map(row => <TableRow key={row.id}><TableCell>{new Intl.DateTimeFormat("vi-VN").format(new Date(row.transactionDate))}</TableCell><TableCell className={row.documentNumber ? "" : "text-amber-700"}>{row.documentNumber || "Thiếu số"}</TableCell><TableCell><p className="font-medium text-slate-800">{row.description}</p><p className="mt-1 text-xs text-slate-500">{row.matterCode || "Không gắn hồ sơ"}</p></TableCell><TableCell>{row.type === "receipt" ? "Thực thu" : "Thực chi"}</TableCell><TableCell className="text-right font-semibold">{money(row.amount)}</TableCell><TableCell>{row.reconciled ? <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700"><CheckCircle2 className="h-4 w-4" />Đã đối chiếu</span> : <span className="text-xs text-amber-700">Chưa đối chiếu</span>}</TableCell><TableCell>{row.attachmentCount ? <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700"><FileCheck2 className="h-4 w-4" />{row.attachmentCount} tệp</span> : <span className="text-xs text-amber-700">Chưa đính kèm</span>}</TableCell></TableRow>)}</TableBody></Table></div>{!report.data?.rows.length && <div className="p-8 text-center"><FileText className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-medium text-slate-700">Chưa có giao dịch trong kỳ</p><p className="mt-1 text-sm text-slate-500">Báo cáo Excel/PDF vẫn có thể xuất để lưu trạng thái kiểm tra kỳ.</p></div>}</CardContent></Card>
    </>}
  </>;
}
