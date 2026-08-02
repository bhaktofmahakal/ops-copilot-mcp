import { describe, it, expect } from "vitest";
import { detectDiscrepancies } from "../../src/services/discrepancy-detector.js";

describe("discrepancyDetectorService", () => {
  it("should detect all 5 seeded discrepancies from synthetic data", () => {
    const result = detectDiscrepancies({ limit: 50 });
    expect(result.total).toBe(5);

    const types = result.discrepancies.map((d) => d.discrepancy_type);
    expect(types).toContain("paid_not_shipped");
    expect(types).toContain("shipped_not_paid");
    expect(types).toContain("refunded_still_shipping");
    expect(types).toContain("double_payment");
    expect(types).toContain("partial_refund_mismatch");
  });

  it("should filter discrepancies by type", () => {
    const result = detectDiscrepancies({ discrepancy_type: "paid_not_shipped" });
    expect(result.total).toBe(1);
    expect(result.discrepancies[0].order_id).toBe("ORD-1004");
  });

  it("should filter discrepancies by severity", () => {
    const result = detectDiscrepancies({ severity: "critical" });
    expect(result.total).toBe(2); // double_payment and shipped_not_paid are critical
  });
});
