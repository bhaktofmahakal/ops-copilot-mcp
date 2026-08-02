import { describe, it, expect } from "vitest";
import { investigateOrder, getOrderUnifiedDetails } from "../../src/services/investigation-engine.js";

describe("investigationEngineService", () => {
  it("should return healthy diagnosis for ORD-1001", () => {
    const result = investigateOrder("ORD-1001");
    expect(result.has_discrepancy).toBe(false);
    expect(result.discrepancy_type).toBeNull();
    expect(result.diagnosis).toContain("healthy");
  });

  it("should diagnose paid_not_shipped for ORD-1004", () => {
    const result = investigateOrder("ORD-1004");
    expect(result.has_discrepancy).toBe(true);
    expect(result.discrepancy_type).toBe("paid_not_shipped");
    expect(result.severity).toBe("high");
    expect(result.recommended_action).toContain("Warehouse A");
  });

  it("should diagnose double_payment for ORD-1007", () => {
    const result = investigateOrder("ORD-1007");
    expect(result.has_discrepancy).toBe(true);
    expect(result.discrepancy_type).toBe("double_payment");
    expect(result.severity).toBe("critical");
    expect(result.recommended_action).toContain("refund");
  });

  it("should diagnose partial_refund_mismatch for ORD-1008", () => {
    const result = investigateOrder("ORD-1008");
    expect(result.has_discrepancy).toBe(true);
    expect(result.discrepancy_type).toBe("partial_refund_mismatch");
    expect(result.diagnosis).toContain("Expected partial refund for 1 returned item was $30.00, but logged payment refund event shows $50.00");
  });

  it("should build unified order timeline", () => {
    const details = getOrderUnifiedDetails("ORD-1001");
    expect(details.order.order_id).toBe("ORD-1001");
    expect(details.timeline.length).toBeGreaterThan(2);
  });

  it("should throw error for unknown order ID", () => {
    expect(() => investigateOrder("ORD-9999")).toThrow("Order 'ORD-9999' not found");
  });
});
