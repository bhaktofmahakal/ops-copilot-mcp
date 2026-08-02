import { describe, it, expect, beforeEach } from "vitest";
import { detectDiscrepancies } from "../../src/services/discrepancy-detector.js";
import { getOrderUnifiedDetails, investigateOrder } from "../../src/services/investigation-engine.js";
import { escalationStore } from "../../src/services/escalation-store.js";

describe("MCP Tools Underlying Logic Integration", () => {
  beforeEach(() => {
    escalationStore.clearInMemory();
  });

  it("ops_list_discrepancies logic works with filters", () => {
    const all = detectDiscrepancies({});
    expect(all.total).toBe(5);

    const filtered = detectDiscrepancies({ discrepancy_type: "paid_not_shipped" });
    expect(filtered.total).toBe(1);
    expect(filtered.discrepancies[0].order_id).toBe("ORD-1004");
  });

  it("ops_get_order_details logic builds unified timeline", () => {
    const details = getOrderUnifiedDetails("ORD-1001");
    expect(details.order.order_id).toBe("ORD-1001");
    expect(details.payments.length).toBe(1);
    expect(details.fulfillments.length).toBe(1);
    expect(details.timeline.length).toBe(6);
  });

  it("ops_investigate_discrepancy logic diagnoses root cause", () => {
    const inv = investigateOrder("ORD-1004");
    expect(inv.has_discrepancy).toBe(true);
    expect(inv.discrepancy_type).toBe("paid_not_shipped");
    expect(inv.recommended_action).toContain("Warehouse A");
  });

  it("ops_create_escalation and ops_get_escalations logic persists records", async () => {
    const esc = await escalationStore.create({
      order_id: "ORD-1004",
      discrepancy_type: "paid_not_shipped",
      severity: "high",
      diagnosis: "Paid 72h ago, fulfillment pending.",
      evidence: {
        order_status: "processing",
        payment_status: "captured",
        fulfillment_status: "pending",
        timeline_summary: "Captured on 2024-01-11",
        related_ids: { payment_id: "PAY-2004", fulfillment_id: "FUL-3004" }
      },
      recommended_action: "Dispatch package immediately."
    });

    expect(esc.escalation_id).toMatch(/^ESC-\d+$/);

    const getRes = await escalationStore.getById(esc.escalation_id);
    expect(getRes).not.toBeNull();
    expect(getRes?.order_id).toBe("ORD-1004");

    const listRes = await escalationStore.list({ order_id: "ORD-1004" });
    expect(listRes.total).toBe(1);
  });
});
