import { describe, it, expect } from "vitest";
import { detectDiscrepancies } from "../../src/services/discrepancy-detector.js";
import { getOrderUnifiedDetails, investigateOrder } from "../../src/services/investigation-engine.js";
import { escalationStore } from "../../src/services/escalation-store.js";

describe("Evaluation XML QA Suite Automated Solver", () => {
  it("Q1: Double payment critical order customer name -> Guy Hawkins", () => {
    const list = detectDiscrepancies({ severity: "critical" });
    const doublePayment = list.discrepancies.find((d) => d.discrepancy_type === "double_payment");
    expect(doublePayment).toBeDefined();

    const details = getOrderUnifiedDetails(doublePayment!.order_id);
    expect(details.order.customer_name).toBe("Guy Hawkins");
  });

  it("Q2: Paid not shipped pending warehouse -> Warehouse A", () => {
    const list = detectDiscrepancies({ discrepancy_type: "paid_not_shipped" });
    const targetId = list.discrepancies[0].order_id;

    const inv = investigateOrder(targetId);
    expect(inv.recommended_action).toContain("Warehouse A");
  });

  it("Q3: Refunded still shipping tracking number -> 9400100666", () => {
    const list = detectDiscrepancies({ discrepancy_type: "refunded_still_shipping" });
    const targetId = list.discrepancies[0].order_id;

    const details = getOrderUnifiedDetails(targetId);
    expect(details.fulfillments[0].tracking_number).toBe("9400100666");
  });

  it("Q4: Shipped not paid gateway reference -> ch_1005_mno", () => {
    const list = detectDiscrepancies({ discrepancy_type: "shipped_not_paid" });
    const targetId = list.discrepancies[0].order_id;

    const details = getOrderUnifiedDetails(targetId);
    expect(details.payments[0].gateway_reference).toBe("ch_1005_mno");
  });

  it("Q5: ORD-1008 refund over-refunded dollar amount -> $20.00", () => {
    const inv = investigateOrder("ORD-1008");
    expect(inv.diagnosis).toContain("$20.00");
  });

  it("Q6: Double payment order SKU -> SKU-G700", () => {
    const list = detectDiscrepancies({ discrepancy_type: "double_payment" });
    const targetId = list.discrepancies[0].order_id;

    const details = getOrderUnifiedDetails(targetId);
    expect(details.order.items[0].sku).toBe("SKU-G700");
  });

  it("Q7: Paid not shipped customer email -> cameron.w@example.com", () => {
    const list = detectDiscrepancies({ discrepancy_type: "paid_not_shipped" });
    const targetId = list.discrepancies[0].order_id;

    const details = getOrderUnifiedDetails(targetId);
    expect(details.order.customer_email).toBe("cameron.w@example.com");
  });

  it("Q8: Shipped not paid carrier -> DHL", () => {
    const list = detectDiscrepancies({ discrepancy_type: "shipped_not_paid" });
    const targetId = list.discrepancies[0].order_id;

    const details = getOrderUnifiedDetails(targetId);
    expect(details.fulfillments[0].carrier).toBe("DHL");
  });

  it("Q9: Escalated order ORD-1004 status -> open", async () => {
    const inv = investigateOrder("ORD-1004");
    const esc = await escalationStore.create({
      order_id: inv.order_id,
      discrepancy_type: inv.discrepancy_type!,
      severity: inv.severity!,
      diagnosis: inv.diagnosis,
      evidence: inv.evidence,
      recommended_action: inv.recommended_action
    });

    const retrieved = await escalationStore.getById(esc.escalation_id);
    expect(retrieved?.status).toBe("open");
  });

  it("Q10: Refund mismatch $100 item SKU -> SKU-H801", () => {
    const list = detectDiscrepancies({ discrepancy_type: "partial_refund_mismatch" });
    const targetId = list.discrepancies[0].order_id;

    const details = getOrderUnifiedDetails(targetId);
    const item = details.order.items.find((i) => i.unit_price === 100.00);
    expect(item?.sku).toBe("SKU-H801");
  });
});
