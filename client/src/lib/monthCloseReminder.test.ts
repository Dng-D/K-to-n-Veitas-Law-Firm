import { describe, expect, it } from "vitest";
import { getMonthCloseReminder } from "./monthCloseReminder";

describe("getMonthCloseReminder", () => {
  it("chỉ hiện nhắc chốt sổ từ ngày 25 theo múi giờ Việt Nam", () => {
    expect(getMonthCloseReminder(new Date("2026-08-24T04:00:00Z"))).toMatchObject({ periodKey: "2026-08", show: false, daysRemaining: 7 });
    expect(getMonthCloseReminder(new Date("2026-08-25T04:00:00Z"))).toMatchObject({ periodKey: "2026-08", show: true, daysRemaining: 6 });
  });

  it("tính đúng ngày cuối tháng, gồm năm nhuận", () => {
    expect(getMonthCloseReminder(new Date("2028-02-29T04:00:00Z"))).toMatchObject({ periodKey: "2028-02", show: true, daysRemaining: 0 });
  });
});
