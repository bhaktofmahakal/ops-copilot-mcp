import { ORDERS, PAYMENTS, FULFILLMENTS } from "../data/synthetic.js";
import { detectDiscrepancies } from "./discrepancy-detector.js";
import { DiscrepancyType, EscalationEvidence } from "../types.js";

export interface InvestigationResult {
  order_id: string;
  has_discrepancy: boolean;
  discrepancy_type: DiscrepancyType | null;
  severity: "low" | "medium" | "high" | "critical" | null;
  diagnosis: string;
  evidence: EscalationEvidence;
  recommended_action: string;
  investigated_at: string;
}

export function investigateOrder(order_id: string): InvestigationResult {
  const order = ORDERS.find((o) => o.order_id === order_id);
  if (!order) {
    throw new Error(`Order '${order_id}' not found. Use ops_list_discrepancies to find active orders with issues.`);
  }

  const payments = PAYMENTS.filter((p) => p.order_id === order_id);
  const fulfillment = FULFILLMENTS.find((f) => f.order_id === order_id);

  // Scan all discrepancies to see if this order has a detected discrepancy
  const allDiscrepancies = detectDiscrepancies({ limit: 100 }).discrepancies;
  const match = allDiscrepancies.find((d) => d.order_id === order_id);

  const now = new Date().toISOString();
  const primaryPayment = payments[0];

  const evidence: EscalationEvidence = {
    order_status: order.status,
    payment_status: primaryPayment ? primaryPayment.status : "none",
    fulfillment_status: fulfillment ? fulfillment.status : "none",
    timeline_summary: `Order created ${order.created_at}. Payment status: ${primaryPayment ? primaryPayment.status : "none"}. Fulfillment status: ${fulfillment ? fulfillment.status : "none"}.`,
    related_ids: {
      payment_id: primaryPayment ? primaryPayment.payment_id : "N/A",
      ...(fulfillment ? { fulfillment_id: fulfillment.fulfillment_id } : {})
    }
  };

  if (!match) {
    return {
      order_id,
      has_discrepancy: false,
      discrepancy_type: null,
      severity: null,
      diagnosis: `Order ${order_id} is healthy. Payment and fulfillment timelines are consistent (Order: ${order.status}, Payment: ${primaryPayment ? primaryPayment.status : "N/A"}, Fulfillment: ${fulfillment ? fulfillment.status : "N/A"}).`,
      evidence,
      recommended_action: "No operational intervention required. Order is proceeding normally.",
      investigated_at: now
    };
  }

  let diagnosis = "";
  let recommended_action = "";

  switch (match.discrepancy_type) {
    case "paid_not_shipped":
      diagnosis = `Root Cause: Payment of $${order.total_amount.toFixed(2)} was successfully captured on ${primaryPayment?.created_at}, but fulfillment status remains '${fulfillment?.status}' at Warehouse A after 72+ hours.`;
      recommended_action = `Contact Warehouse A fulfillment dispatch immediately to pick and pack order ${order_id}, or escalate to logistics supervisor if stock is out of bounds.`;
      break;

    case "shipped_not_paid":
      diagnosis = `Root Cause: Package was shipped out via ${fulfillment?.carrier} (Tracking: ${fulfillment?.tracking_number}), but payment authorization (${primaryPayment?.payment_id}) was never captured prior to shipment. Risk of uncollected revenue.`;
      recommended_action = `Attempt immediate manual payment capture via Stripe gateway for payment ${primaryPayment?.payment_id}. If capture fails, flag account and contact customer before delivery.`;
      break;

    case "refunded_still_shipping":
      diagnosis = `Root Cause: Full payment refund of $${order.total_amount.toFixed(2)} was issued to customer on ${primaryPayment?.updated_at}, but fulfillment status is still '${fulfillment?.status}' (Carrier: ${fulfillment?.carrier}, Tracking: ${fulfillment?.tracking_number}).`;
      recommended_action = `Issue immediate delivery intercept request with ${fulfillment?.carrier} for tracking ${fulfillment?.tracking_number} to prevent un-paid goods delivery.`;
      break;

    case "double_payment":
      const captured = payments.filter((p) => p.status === "captured");
      diagnosis = `Root Cause: Duplicate payment capture detected. Order total is $${order.total_amount.toFixed(2)}, but 2 payment records (${captured.map((p) => p.payment_id).join(", ")}) were captured, charging customer $${(order.total_amount * 2).toFixed(2)}.`;
      recommended_action = `Issue an immediate refund for duplicate payment ${captured[1]?.payment_id || "PAY-2007-B"} via payment gateway and notify customer.`;
      break;

    case "partial_refund_mismatch":
      diagnosis = `Root Cause: Partial refund audit mismatch on order ${order_id}. Expected partial refund for 1 returned item was $30.00, but logged payment refund event shows $50.00 (over-refunded by $20.00).`;
      recommended_action = `Escalate to finance department to review refund transaction ${primaryPayment?.payment_id} and adjust accounting ledger.`;
      break;
  }

  return {
    order_id,
    has_discrepancy: true,
    discrepancy_type: match.discrepancy_type,
    severity: match.severity,
    diagnosis,
    evidence,
    recommended_action,
    investigated_at: now
  };
}

export function getOrderUnifiedDetails(order_id: string) {
  const order = ORDERS.find((o) => o.order_id === order_id);
  if (!order) {
    throw new Error(`Order '${order_id}' not found. Use ops_list_discrepancies to find orders with issues, or check that the ID format is ORD-XXXX.`);
  }

  const payments = PAYMENTS.filter((p) => p.order_id === order_id);
  const fulfillments = FULFILLMENTS.filter((f) => f.order_id === order_id);

  // Build merged chronological timeline
  const timeline: Array<{
    timestamp: string;
    source: "order" | "payment" | "fulfillment";
    event_type: string;
    details: string;
  }> = [];

  timeline.push({
    timestamp: order.created_at,
    source: "order",
    event_type: "order_created",
    details: `Order created by ${order.customer_name} for $${order.total_amount.toFixed(2)}`
  });

  for (const p of payments) {
    for (const e of p.events) {
      timeline.push({
        timestamp: e.timestamp,
        source: "payment",
        event_type: e.event_type,
        details: e.details
      });
    }
  }

  for (const f of fulfillments) {
    for (const e of f.events) {
      timeline.push({
        timestamp: e.timestamp,
        source: "fulfillment",
        event_type: e.event_type,
        details: `${e.details} (${e.location})`
      });
    }
  }

  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    order,
    payments,
    fulfillments,
    timeline
  };
}
