import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BadgeDollarSign, BriefcaseBusiness, ChartNoAxesCombined, FileBarChart2, Landmark, LockKeyhole, LogOut, PanelLeft, ReceiptText, Scale, ShieldCheck, WalletCards } from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: ChartNoAxesCombined, label: "Tổng quan", path: "/" },
  { icon: BriefcaseBusiness, label: "Hồ sơ / Hợp đồng", path: "/ho-so" },
  { icon: ReceiptText, label: "Sổ doanh thu", path: "/doanh-thu" },
  { icon: WalletCards, label: "Sổ chi phí", path: "/chi-phi" },
  { icon: Landmark, label: "Nhật ký thu–chi", path: "/thu-chi" },
  { icon: FileBarChart2, label: "Báo cáo theo kỳ", path: "/bao-cao" },
  { icon: LockKeyhole, label: "Phê duyệt & khóa sổ", path: "/ky-ke-toan" },
  { icon: ShieldCheck, label: "Quyền truy cập", path: "/quyen-truy-cap" },
];

const SIDEBAR_WIDTH_KEY = "veritas-sidebar-width";
const VERITAS_LOGO_URL = "/manus-storage/veritas-law-firm-logo_506c698d.png";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || 272);
  const { loading, user } = useAuth();
  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)), [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return <main className="login-canvas"><section className="login-card"><div className="brand-seal overflow-hidden"><img src={VERITAS_LOGO_URL} alt="Logo Công ty Luật TNHH Veritas" className="h-full w-full object-cover" /></div><p className="eyebrow">VERITAS · TÀI CHÍNH PHÁP LÝ</p><h1>Kiểm soát tài chính, rõ ràng từng hồ sơ.</h1><p>Đăng nhập để xem dữ liệu doanh thu, dòng tiền và công nợ của Công ty Luật TNHH Veritas.</p><Button onClick={() => startLogin()} className="w-full">Đăng nhập hệ thống</Button></section></main>;
  }
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  const current = menuItems.find(item => item.path === location) ?? menuItems[0];

  return <>
    <Sidebar collapsible="icon" className="border-r border-slate-800 bg-[#10243B] text-slate-100">
      <SidebarHeader className="h-[76px] border-b border-slate-700/70 px-3 py-0 justify-center">
        <div className="flex items-center gap-3 w-full"><button onClick={toggleSidebar} className="rounded-lg p-2 text-slate-300 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300" aria-label="Thu gọn thanh điều hướng"><PanelLeft className="h-4 w-4" /></button><img src={VERITAS_LOGO_URL} alt="Veritas" className="h-9 w-9 shrink-0 rounded-lg object-cover" />{!isCollapsed && <div className="min-w-0"><p className="font-serif text-base font-semibold leading-none tracking-wide text-white">VERITAS</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-teal-200">Finance Desk</p></div>}</div>
      </SidebarHeader>
      <SidebarContent className="bg-[#10243B] px-2 pt-4"><SidebarMenu>{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-teal-400/15 data-[active=true]:text-teal-100"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent>
      <SidebarFooter className="border-t border-slate-700/70 bg-[#10243B] p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"><Avatar className="h-9 w-9 border border-slate-600"><AvatarFallback className="bg-teal-100 text-xs font-bold text-teal-800">{user?.name?.charAt(0).toUpperCase() || "V"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium text-white">{user?.name || "Tài khoản Veritas"}</p><p className="mt-0.5 truncate text-[11px] text-slate-400">{user?.role === "admin" ? "Chủ sở hữu" : "Nhân viên kế toán"}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Đăng xuất</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter>
    </Sidebar>
    <SidebarInset className="min-w-0 bg-[#F7F9FC]">
      {isMobile && <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur"><SidebarTrigger className="rounded-lg" /><img src={VERITAS_LOGO_URL} alt="Veritas" className="h-8 w-8 rounded-lg object-cover" /><div><p className="text-sm font-semibold text-slate-800">{current.label}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Veritas Finance</p></div></header>}
      <main className="min-h-screen p-4 md:p-6 lg:p-8">{children}</main>
    </SidebarInset>
  </>;
}
