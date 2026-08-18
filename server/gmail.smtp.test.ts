import nodemailer from "nodemailer";
import { describe, expect, it } from "vitest";

describe("Gmail SMTP", () => {
  it("xác minh được thông tin xác thực để gửi thư mời", async () => {
    expect(process.env.GMAIL_SMTP_USER).toMatch(/^[^\s@]+@gmail\.com$/i);
    expect(process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s/g, "")).toHaveLength(16);

    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_SMTP_USER,
        pass: process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s/g, ""),
      },
    });

    await expect(transport.verify()).resolves.toBe(true);
  }, 30_000);
});
