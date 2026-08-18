import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";

export default function AccessControlPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const access = trpc.finance.access.useQuery();
  const isOwner = access.data?.canManageAccess ?? false;
  const accounts = trpc.finance.accessControl.listUsers.useQuery(undefined, { enabled: isOwner });
  const updateRole = trpc.finance.accessControl.setUserRole.useMutation({
    onSuccess: () => { utils.finance.accessControl.listUsers.invalidate(); toast.success("Đã cập nhật vai trò tài khoản."); },
    onError: error => toast.error(error.message),
  });
  const setRole = (id: number, name: string | null, role: "admin" | "user") => {
    const action = role === "admin" ? "cấp quyền quản trị viên" : "hạ về vai trò nhân viên kế toán";
    if (window.confirm(`Xác nhận ${action} cho ${name || `tài khoản #${id}`}?`)) updateRole.mutate({ userId: id, role });
  };
  return <>
    <div className="mb-6"><p className="eyebrow">BẢO MẬT VÀ KIỂM SOÁT</p><h1 className="page-title">Quyền truy cập</h1><p className="page-description">Phân công vai trò để duy trì phân tách nhiệm vụ trong quy trình khóa sổ và phê duyệt báo cáo hai cấp.</p></div>
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><Card className="panel-card"><CardContent className="p-6"><div className="flex items-start gap-3"><div className="kpi-icon navy"><ShieldCheck /></div><div><p className="panel-title">Nguyên tắc phân tách nhiệm vụ</p><p className="panel-subtitle">Yêu cầu tối thiểu cho phê duyệt báo cáo hai cấp.</p></div></div><div className="mt-5 space-y-4 text-sm leading-6 text-slate-600"><p><strong className="text-slate-800">Người lập:</strong> tạo yêu cầu xác nhận báo cáo sau khi khóa sổ.</p><p><strong className="text-slate-800">Cấp 1 và cấp 2:</strong> là hai quản trị viên khác nhau, không trùng người lập.</p><p><strong className="text-slate-800">Khuyến nghị:</strong> duy trì tối thiểu ba tài khoản hoạt động trước khi dùng quy trình hai cấp.</p></div><div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle className="mr-2 inline h-4 w-4" />Chỉ cấp quyền quản trị viên cho người có thẩm quyền; vai trò này có thể phê duyệt, khóa sổ và quản lý dữ liệu nhạy cảm.</div></CardContent></Card>
      <Card className="panel-card overflow-hidden"><CardContent className="p-0"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><div className="rounded-xl bg-teal-50 p-2 text-teal-700"><UsersRound className="h-5 w-5" /></div><div><p className="panel-title">Danh sách tài khoản</p><p className="panel-subtitle">Chỉ chủ sở hữu có thể cấp hoặc hạ quyền quản trị viên.</p></div></div>{!isOwner ? <div className="p-6 text-sm text-slate-600">Chỉ chủ sở hữu dự án mới có thể xem và quản lý vai trò tài khoản.</div> : <><div className="hidden md:block table-wrap"><Table><TableHeader><TableRow><TableHead>Tài khoản</TableHead><TableHead>Đăng nhập gần nhất</TableHead><TableHead>Vai trò</TableHead></TableRow></TableHeader><TableBody>{accounts.data?.map(account => <TableRow key={account.id}><TableCell><p className="font-medium text-slate-800">{account.name || `Tài khoản #${account.id}`}</p><p className="mt-1 text-xs text-slate-500">{account.email || `ID ${account.id}`}</p></TableCell><TableCell className="text-sm text-slate-600">{new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(account.lastSignedIn))}</TableCell><TableCell><Select value={account.role} onValueChange={value => setRole(account.id, account.name, value as "admin" | "user")} disabled={updateRole.isPending || account.openId === user?.openId}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Quản trị viên</SelectItem><SelectItem value="user">Nhân viên kế toán</SelectItem></SelectContent></Select></TableCell></TableRow>)}</TableBody></Table></div><div className="space-y-3 p-4 md:hidden">{accounts.data?.map(account => <div key={account.id} className="rounded-xl border border-slate-100 p-4"><p className="font-medium text-slate-800">{account.name || `Tài khoản #${account.id}`}</p><p className="mt-1 text-xs text-slate-500">{account.email || `ID ${account.id}`} · {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(account.lastSignedIn))}</p><div className="mt-3"><Select value={account.role} onValueChange={value => setRole(account.id, account.name, value as "admin" | "user")} disabled={updateRole.isPending || account.openId === user?.openId}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Quản trị viên</SelectItem><SelectItem value="user">Nhân viên kế toán</SelectItem></SelectContent></Select></div></div>)}</div>{!accounts.data?.length && <div className="p-6 text-sm text-slate-500">Chưa có tài khoản nào khác đăng nhập hệ thống.</div>}</>}</CardContent></Card></div>
  </>;
}
