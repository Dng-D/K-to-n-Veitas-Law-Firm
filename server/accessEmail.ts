import nodemailer from "nodemailer";
import { ENV } from "./_core/env";
import { DELEGABLE_PERMISSIONS, type DelegablePermission } from "./permissions";

const permissionLabels: Record<DelegablePermission, string> = {
  approve_month_close: "Phê duyệt kỳ kế toán",
  lock_month_close: "Khóa sổ tháng",
  reopen_month_close: "Mở lại kỳ đã khóa",
  approve_report_level_1: "Phê duyệt báo cáo cấp 1",
  approve_report_level_2: "Phê duyệt báo cáo cấp 2",
  reject_report: "Từ chối báo cáo",
  delete_financial_data: "Xóa dữ liệu nghiệp vụ",
};

function formatExpiry(expiresAt?: Date | null) {
  return expiresAt
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(expiresAt)
    : "Không thời hạn";
}

export async function sendAccessInvitationEmail(input: {
  recipient: string;
  role: "admin" | "staff";
  permissions: DelegablePermission[];
  expiresAt?: Date | null;
}) {
  if (process.env.VITEST) return { sent: false as const, skipped: true as const };
  if (!ENV.gmailSmtpUser || !ENV.gmailSmtpAppPassword) throw new Error("SMTP Gmail chưa được cấu hình.");

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: ENV.gmailSmtpUser, pass: ENV.gmailSmtpAppPassword.replace(/\s/g, "") },
  });
  const roleName = input.role === "admin" ? "Quản trị viên được ủy quyền" : "Nhân sự kế toán";
  const permissions = input.permissions.length ? input.permissions.filter(value => DELEGABLE_PERMISSIONS.includes(value)).map(value => `- ${permissionLabels[value]}`).join("\n") : "- Không có thẩm quyền phê duyệt hoặc kiểm soát dữ liệu nhạy cảm";
  await transport.sendMail({
    from: `Veritas Finance Desk <${ENV.gmailSmtpUser}>`,
    to: input.recipient,
    subject: "Lời mời truy cập Veritas Finance Desk",
    text: `Kính gửi,\n\nQuý vị được mời tham gia Veritas Finance Desk với vai trò: ${roleName}.\n\nThẩm quyền được cấp:\n${permissions}\n\nThời hạn thẩm quyền: ${formatExpiry(input.expiresAt)}.\n\nVui lòng đăng nhập Veritas Finance Desk bằng đúng địa chỉ email này để kích hoạt quyền. Nếu không nhận lời mời hoặc có thắc mắc, vui lòng liên hệ chủ sở hữu hệ thống.\n\nTrân trọng,\nVeritas Finance Desk`,
  });
  return { sent: true as const, skipped: false as const };
}
