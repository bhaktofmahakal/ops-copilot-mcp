import { describe, it, expect, beforeEach } from "vitest";
import { escalationStore } from "../../src/services/escalation-store.js";

describe("EscalationStoreService", () => {
  beforeEach(() => {
    escalationStore.clearInMemory();
  });

  it("should create and retrieve an escalation record", async () => {
    const created = await escalationStore.create({
      order_id: "ORD-1004",
      discrepancy_type: "paid_not_shipped",
      severity: "high",
      diagnosis: "Payment captured 72h ago, fulfillment pending.",
      evidence: {
        order_status: "processing",
        payment_status: "captured",
        fulfillment_status: "pending",
        timeline_summary: "Captured 2024-01-11T10:02:00Z",
        related_ids: { payment_id: "PAY-2004", fulfillment_id: "FUL-3004" }
      },
      recommended_action: "Contact Warehouse A to dispatch order ORD-1004 immediately."
    });

    expect(created.escalation_id).toMatch(/^ESC-\d+$/);
    expect(created.status).toBe("open");

    const retrieved = await escalationStore.getById(created.escalation_id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.order_id).toBe("ORD-1004");
  });

  it("should filter and list escalations with pagination", async () => {
    await escalationStore.create({
      order_id: "ORD-1004",
      discrepancy_type: "paid_not_shipped",
      severity: "high",
      diagnosis: "Test 1",
      evidence: { order_status: "processing", payment_status: "captured", fulfillment_status: "pending", timeline_summary: "", related_ids: { payment_id: "P1" } },
      recommended_action: "Action 1"
    });

    await escalationStore.create({
      order_id: "ORD-1005",
      discrepancy_type: "shipped_not_paid",
      severity: "critical",
      diagnosis: "Test 2",
      evidence: { order_status: "shipped", payment_status: "authorized", fulfillment_status: "shipped", timeline_summary: "", related_ids: { payment_id: "P2" } },
      recommended_action: "Action 2"
    });

    const listResult = await escalationStore.list({ limit: 10 });
    expect(listResult.total).toBe(2);
    expect(listResult.escalations.length).toBe(2);

    const filtered = await escalationStore.list({ order_id: "ORD-1004" });
    expect(filtered.total).toBe(1);
    expect(filtered.escalations[0].order_id).toBe("ORD-1004");
  });
});
