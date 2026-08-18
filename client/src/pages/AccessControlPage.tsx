import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, MailPlus, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PERMISSIONS = [
  ["approve_month_close", "Phê duyệt kỳ kế toán"],
  ["lock_month_close", "Khóa sổ tháng"],
  ["reopen_month_close", "Mở lại kỳ đã khóa"],
  ["approve_report_level_1", "Phê duyệt báo cáo cấp 1"],
  ["approve_report_level_2", "Phê duyệt báo cáo cấp 2"],
  ["reject_report", "Từ chối báo cáo"],
  ["delete_financial_data", "Xóa dữ liệu nghiệp vụ"],
] as const;

type Permission = (typeof PERMISSIONS)[number][0];
type Account = { id: number; openId: string; name: string | null; email: string | null; role: "owner" | "admin" | "staff"; lastSignedIn: Date; isOwner: boolean; permissions: Permission[] };

function permissionName(permission: string) {
  return PERMISSIONS.find(([code]) => code === permission)?.[1] || permission;
}

function PermissionPicker({ selected, onChange }: { selected: Permission[]; onChange: (permissions: Permission[]) => void }) {
  return <div className="grid gap-2 sm:grid-cols-2">{PERMISSIONS.map(([code, label]) => <label key={code} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"><input type="checkbox" className="mt-0.5 accent-teal-700" checked={selected.includes(code)} onChange={event => onChange(event.target.checked ? [...selected, code] : selected.filter(value => value !== code))} /><span>{label}</span></label>)}</div>;
}

function AccountCard({ account, onSave, saving }: { account: Account; onSave: (input: { userId: number; role: "admin" | "staff"; permissions: Permission[] }) => void; saving: boolean }) {
  const [role, setRole] = useState<"admin" | "staff">(account.role === "admin" ? "admin" : "staff");
  const [permissions, setPermissions] = useState<Permission[]>(account.permissions);
  const changed = role !== account.role || permissions.join("|") !== account.permissions.join("|");
  const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(account.lastSignedIn));
  return <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium text-slate-900">{account.name || `Tài khoản #${account.id}`}</p><p className="mt-1 text-xs text-slate-500">{account.email || "Chưa có email"} · Đăng nhập: {date}</p></div><Badge className={account.isOwner ? "bg-amber-100 text-amber-900" : account.role === "admin" ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-700"}>{account.isOwner ? "Chủ sở hữu" : account.role === "admin" ? "Quản trị viên" : "Nhân sự"}</Badge></div>{account.isOwner ? <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">Tài khoản chủ sở hữu luôn có toàn bộ quyền và không thể được thay đổi, hạ quyền hoặc ủy quyền bởi tài khoản khác.</div> : <div className="mt-4 space-y-4"><div className="max-w-xs"><Label>Vai trò</Label><Select value={role} onValueChange={value => { setRole(value as "admin" | "staff"); if (value === "staff") setPermissions([]); }}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Quản trị viên được ủy quyền</SelectItem><SelectItem value="staff">Nhân sự kế toán</SelectItem></SelectContent></Select></div>{role === "admin" ? <div><Label>Thẩm quyền do chủ sở hữu cấp</Label><p className="mb-2 mt-1 text-xs text-slate-500">Không chọn quyền nào đồng nghĩa quản trị viên không thể phê duyệt, khóa sổ, mở sổ, xóa dữ liệu hay can thiệp nghiệp vụ nhạy cảm.</p><PermissionPicker selected={permissions} onChange={setPermissions} /></div> : <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">Nhân sự được ghi nhận nghiệp vụ cơ bản, không có thẩm quyền phê duyệt, khóa sổ hoặc xóa dữ liệu.</p>}<Button type="button" size="sm" onClick={() => onSave({ userId: account.id, role, permissions })} disabled={!changed || saving}>Lưu phân quyền</Button></div>}</div>;
}

export default function AccessControlPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const access = trpc.finance.access.useQuery();
  const isOwner = access.data?.isOwner ?? false;
  const directory = trpc.finance.accessControl.directory.useQuery(undefined, { enabled: isOwner });
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");
  const [invitePermissions, setInvitePermissions] = useState<Permission[]>([]);
  const refresh = () => { utils.finance.accessControl.directory.invalidate(); utils.finance.access.invalidate(); };
  const invite = trpc.finance.accessControl.inviteByEmail.useMutation({ onSuccess: result => { refresh(); setEmail(""); setInvitePermissions([]); toast.success(result.state === "updated_existing" ? "Đã cập nhật quyền cho tài khoản đang hoạt động." : "Đã lưu lời mời. Nhân sự cần đăng nhập bằng đúng email để kích hoạt quyền."); }, onError: error => toast.error(error.message) });
  const saveAccess = trpc.finance.accessControl.setUserAccess.useMutation({ onSuccess: () => { refresh(); toast.success("Đã cập nhật vai trò và thẩm quyền được ủy quyền."); }, onError: error => toast.error(error.message) });
  const submitInvite = () => { if (!email.trim()) return toast.error("Vui lòng nhập email nhân sự."); if (inviteRole === "staff" && invitePermissions.length) return toast.error("Nhân sự không thể nhận quyền phê duyệt hoặc kiểm soát dữ liệu."); invite.mutate({ email, role: inviteRole, permissions: inviteRole === "admin" ? invitePermissions : [] }); };
  const accounts = (directory.data?.users || []) as Account[];
  const approvers = accounts.filter(account => account.isOwner || account.permissions.some(permission => permission.startsWith("approve_") || permission === "reject_report"));
  return <><div className="mb-6"><p className="eyebrow">BẢO MẬT VÀ ỦY QUYỀN</p><h1 className="page-title">Quyền truy cập theo email</h1><p className="page-description">Chủ sở hữu quản lý nhân sự bằng email, chỉ định quản trị viên và cấp từng thẩm quyền độc lập cho phê duyệt, khóa sổ hoặc dữ liệu nhạy cảm.</p></div>{!isOwner ? <Card className="panel-card"><CardContent className="p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-teal-700" /><div><p className="panel-title">Khu vực dành cho chủ sở hữu</p><p className="panel-subtitle mt-1">Tài khoản của ông/bà không có quyền quản lý người dùng. Vui lòng liên hệ chủ sở hữu hệ thống nếu cần thay đổi thẩm quyền.</p></div></div></CardContent></Card> : <div className="space-y-5"><div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]"><Card className="panel-card"><CardContent className="p-6"><div className="flex items-start gap-3"><div className="kpi-icon navy"><MailPlus /></div><div><p className="panel-title">Thêm nhân sự bằng email</p><p className="panel-subtitle">Quyền chỉ kích hoạt khi người được mời đăng nhập đúng email.</p></div></div><div className="mt-5 space-y-4"><div><Label htmlFor="invite-email">Email nhân sự</Label><Input id="invite-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="nhansu@veritas.vn" className="mt-1" /></div><div><Label>Vai trò dự kiến</Label><Select value={inviteRole} onValueChange={value => { setInviteRole(value as "admin" | "staff"); if (value === "staff") setInvitePermissions([]); }}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="staff">Nhân sự kế toán</SelectItem><SelectItem value="admin">Quản trị viên được ủy quyền</SelectItem></SelectContent></Select></div>{inviteRole === "admin" && <div><Label>Thẩm quyền được cấp</Label><p className="mb-2 mt-1 text-xs text-slate-500">Chọn tối thiểu theo nguyên tắc cần biết và cần làm.</p><PermissionPicker selected={invitePermissions} onChange={setInvitePermissions} /></div>}<Button type="button" onClick={submitInvite} disabled={invite.isPending} className="w-full">{invite.isPending ? "Đang lưu lời mời…" : "Lưu lời mời và quyền"}</Button></div></CardContent></Card><Card className="panel-card"><CardContent className="p-6"><div className="flex items-start gap-3"><div className="kpi-icon teal"><UserCog /></div><div><p className="panel-title">Tài khoản có thẩm quyền phê duyệt</p><p className="panel-subtitle">Danh mục hiện hành để kiểm tra phân tách nhiệm vụ.</p></div></div><div className="mt-5 space-y-3">{approvers.length ? approvers.map(account => <div key={account.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-800">{account.name || account.email || `Tài khoản #${account.id}`}</p><Badge className={account.isOwner ? "bg-amber-100 text-amber-900" : "bg-teal-100 text-teal-800"}>{account.isOwner ? "Chủ sở hữu" : "Quản trị viên"}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-600">{account.isOwner ? "Toàn bộ thẩm quyền" : account.permissions.map(permissionName).join(" · ")}</p></div>) : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Chưa có tài khoản được ủy quyền phê duyệt.</p>}</div></CardContent></Card></div><Card className="panel-card"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="kpi-icon navy"><UsersRound /></div><div><p className="panel-title">Danh mục tài khoản và thẩm quyền</p><p className="panel-subtitle">Chỉ chủ sở hữu có thể thay đổi vai trò hoặc quyền. Mọi điều chỉnh được ghi nhật ký.</p></div></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{accounts.map(account => <AccountCard key={account.id} account={account} saving={saveAccess.isPending} onSave={input => { if (window.confirm(`Xác nhận cập nhật vai trò và quyền cho ${account.name || account.email || `tài khoản #${account.id}`}?`)) saveAccess.mutate(input); }} />)}</div></CardContent></Card><Card className="panel-card"><CardContent className="p-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-teal-700" /><div><p className="panel-title">Nhật ký ủy quyền gần đây</p><p className="panel-subtitle">Theo dõi cấp, thu hồi, đổi vai trò và kích hoạt lời mời.</p></div></div><div className="mt-4 space-y-2">{directory.data?.actions.map(action => <div key={action.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><span><strong className="text-slate-800">{action.action}</strong>{action.permission ? ` · ${permissionName(action.permission)}` : ""}{action.targetEmail ? ` · ${action.targetEmail}` : ""}</span><span>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(action.createdAt))}</span></div>) || <p className="text-sm text-slate-500">Chưa có dữ liệu nhật ký.</p>}</div></CardContent></Card></div>}</>;
}
