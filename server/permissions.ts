export const DELEGABLE_PERMISSIONS = ["approve_month_close", "lock_month_close", "reopen_month_close", "approve_report_level_1", "approve_report_level_2", "reject_report", "delete_financial_data"] as const;
export type DelegablePermission = (typeof DELEGABLE_PERMISSIONS)[number];
