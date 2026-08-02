import { describe, it, expect, beforeEach } from "vitest";
import { detectDiscrepancies } from "../../src/services/discrepancy-detector.js";
import { investigateOrder, getOrderUnifiedDetails } from "../../src/services/investigation-engine.js";
import { escalationStore } from "../../src/services/escalation-store.js";

describe("E2E Commerce Operations Workflow Test", () => {
  beforeEach(() => {
    escalationStore.clearInMemory();
  });

  it("should execute full detect -> investigate -> escalate -> retrieve pipeline end-to-end", async () => {
    // Step 1: Detect discrepancies across synthetic dataset
    const detectionResult = detectDiscrepancies({ limit: 10 });
    expect(detectionResult.total).toBe(5);
    expect(detectionResult.discrepancies.length).toBe(5);

    const paidNotShipped = detectionResult.discrepancies.find((d) => d.discrepancy_type === "paid_not_shipped");
    expect(paidNotShipped).toBeDefined();
    const targetOrderId = paidNotShipped!.order_id; // ORD-1004

    // Step 2: Fetch unified order timeline & details
    const orderDetails = getOrderUnifiedDetails(targetOrderId);
    expect(orderDetails.order.order_id).toBe(targetOrderId);
    expect(orderDetails.timeline.length).toBeGreaterThan(0);

    // Step 3: Run automated investigation engine
    const diagnosis = investigateOrder(targetOrderId);
    expect(diagnosis.has_discrepancy).toBe(true);
    expect(diagnosis.discrepancy_type).toBe("paid_not_shipped");
    expect(diagnosis.evidence.order_status).toBe("processing");
    expect(diagnosis.evidence.payment_status).toBe("captured");
    expect(diagnosis.evidence.fulfillment_status).toBe("pending");
    expect(diagnosis.recommended_action).toContain("Warehouse A");

    // Step 4: Escalate by creating a durable escalation record
    const escalationRecord = await escalationStore.create({
      order_id: diagnosis.order_id,
      discrepancy_type: diagnosis.discrepancy_type!,
      severity: diagnosis.severity!,
      diagnosis: diagnosis.diagnosis,
      evidence: diagnosis.evidence,
      recommended_action: diagnosis.recommended_action
    });

    expect(escalationRecord.escalation_id).toMatch(/^ESC-\d+$/);
    expect(escalationRecord.status).toBe("open");

    // Step 5: Retrieve escalation history and confirm persistence & evidence content
    const retrievedEscalation = await escalationStore.getById(escalationRecord.escalation_id);
    expect(retrievedEscalation).not.toBeNull();
    expect(retrievedEscalation?.order_id).toBe(targetOrderId);
    expect(retrievedEscalation?.discrepancy_type).toBe("paid_not_shipped");

    const listResult = await escalationStore.list({ order_id: targetOrderId });
    expect(listResult.total).toBe(1);
    expect(listResult.escalations[0].escalation_id).toBe(escalationRecord.escalation_id);
  });
});
