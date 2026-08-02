import { describe, it, expect } from "vitest";
import { getOrderUnifiedDetails, investigateOrder } from "../../src/services/investigation-engine.js";
import { escalationStore } from "../../src/services/escalation-store.js";
import {
  GetOrderDetailsInputSchema,
  InvestigateDiscrepancyInputSchema,
  CreateEscalationInputSchema,
  GetEscalationsInputSchema
} from "../../src/schemas/index.js";

describe("Error-Case & Schema Validation Tests", () => {
  it("should fail validation on invalid order_id format in GetOrderDetailsInputSchema", () => {
    const result = GetOrderDetailsInputSchema.safeParse({ order_id: "INVALID-123" });
    expect(result.success).toBe(false);
  });

  it("should fail validation on invalid order_id format in InvestigateDiscrepancyInputSchema", () => {
    const result = InvestigateDiscrepancyInputSchema.safeParse({ order_id: "1004" });
    expect(result.success).toBe(false);
  });

  it("should fail validation on invalid escalation_id format in GetEscalationsInputSchema", () => {
    const result = GetEscalationsInputSchema.safeParse({ escalation_id: "INVALID-ESC" });
    expect(result.success).toBe(false);
  });

  it("should fail validation on missing required fields in CreateEscalationInputSchema", () => {
    const result = CreateEscalationInputSchema.safeParse({
      order_id: "ORD-1004"
      // missing discrepancy_type, severity, diagnosis, evidence, recommended_action
    });
    expect(result.success).toBe(false);
  });

  it("should throw informative error for unknown order ID in getOrderUnifiedDetails", () => {
    expect(() => getOrderUnifiedDetails("ORD-9999")).toThrow("Order 'ORD-9999' not found");
  });

  it("should throw informative error for unknown order ID in investigateOrder", () => {
    expect(() => investigateOrder("ORD-9999")).toThrow("Order 'ORD-9999' not found");
  });

  it("should return null for unknown escalation ID in escalationStore", async () => {
    const esc = await escalationStore.getById("ESC-9999");
    expect(esc).toBeNull();
  });
});
