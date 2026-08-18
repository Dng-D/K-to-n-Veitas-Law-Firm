export function getMonthCloseReminder(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  const year = Number(value("year"));
  const month = Number(value("month"));
  const dayOfMonth = Number(value("day"));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { periodKey: `${year}-${String(month).padStart(2, "0")}`, daysRemaining: lastDay - dayOfMonth, show: dayOfMonth >= 25 };
}
