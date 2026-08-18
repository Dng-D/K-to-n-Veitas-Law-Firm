import { describe, expect, it } from "vitest";
import { getPeriodBounds, isPeriodMutableStatus, toPeriodKey } from "./db";

describe("accounting period guards", () => {
  it("chỉ cho phép ghi dữ liệu trong kỳ mở, bị từ chối hoặc chưa khởi tạo", () => {
    expect(isPeriodMutableStatus()).toBe(true);
    expect(isPeriodMutableStatus("open")).toBe(true);
    expect(isPeriodMutableStatus("rejected")).toBe(true);
    expect(isPeriodMutableStatus("pending_approval")).toBe(false);
    expect(isPeriodMutableStatus("approved")).toBe(false);
    expect(isPeriodMutableStatus("locked")).toBe(false);
  });

  it("xác định đúng khóa và phạm vi tháng theo UTC", () => {
    expect(toPeriodKey(new Date("2026-08-18T10:00:00Z"))).toBe("2026-08");
    const range = getPeriodBounds("2026-02");
    expect(range.start.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-02-28T23:59:59.999Z");
  });
});

