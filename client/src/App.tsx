import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CashPage, DashboardPage, ExpensesPage, MattersPage, ReportsPage, RevenuesPage } from "./pages/FinancePages";
import AccessControlPage from "./pages/AccessControlPage";
import NotFound from "./pages/NotFound";
import PeriodClosePage from "./pages/PeriodClosePage";
import ReportApprovalPage from "./pages/ReportApprovalPage";

function Router() {
  return <DashboardLayout><Switch><Route path="/" component={DashboardPage} /><Route path="/ho-so" component={MattersPage} /><Route path="/doanh-thu" component={RevenuesPage} /><Route path="/chi-phi" component={ExpensesPage} /><Route path="/thu-chi" component={CashPage} /><Route path="/bao-cao" component={ReportsPage} /><Route path="/ky-ke-toan" component={PeriodClosePage} /><Route path="/phe-duyet-bao-cao" component={ReportApprovalPage} /><Route path="/quyen-truy-cap" component={AccessControlPage} /><Route component={NotFound} /></Switch></DashboardLayout>;
}
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
