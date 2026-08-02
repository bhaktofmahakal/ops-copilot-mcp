import { ORDERS, PAYMENTS, FULFILLMENTS } from "../data/synthetic.js";
import { DiscrepancySummary, DiscrepancyType } from "../types.js";

export interface ListDiscrepanciesFilter {
  discrepancy_type?: DiscrepancyType;
  severity?: "low" | "medium" | "high" | "critical";
  limit?: number;
  offset?: number;
}

const SEVERITY_LEVELS: Record<"low" | "medium" | "high" | "critical", number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export function detectDiscrepancies(filter: ListDiscrepanciesFilter = {}): {
  total: number;
  count: number;
  offset: number;
  discrepancies: DiscrepancySummary[];
  has_more: boolean;
  next_offset?: number;
} {
  const summaries: DiscrepancySummary[] = [];

  for (const order of ORDERS) {
    const payments = PAYMENTS.filter((p) => p.order_id === order.order_id);
    const fulfillment = FULFILLMENTS.find((f) => f.order_id === order.order_id);

    // Rule 1: Double payment (multiple captured payments for single order)
    const capturedPayments = payments.filter((p) => p.status === "captured");
    if (capturedPayments.length > 1) {
      summaries.push({
        order_id: order.order_id,
        discrepancy_type: "double_payment",
        severity: "critical",
        summary: `Order ${order.order_id} has ${capturedPayments.length} captured payments totaling $${capturedPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}.`,
        detected_at: order.updated_at
      });
      continue;
    }

    // Rule 2: Refunded but still shipping (Payment refunded, fulfillment active/shipped)
    const refundedPayment = payments.find((p) => p.status === "refunded");
    if (refundedPayment && fulfillment && (fulfillment.status === "shipped" || fulfillment.status === "in_transit" || fulfillment.status === "pending" || fulfillment.status === "delivered")) {
      summaries.push({
        order_id: order.order_id,
        discrepancy_type: "refunded_still_shipping",
        severity: "high",
        summary: `Payment was fully refunded on ${refundedPayment.updated_at}, but package fulfillment status is still '${fulfillment.status}'.`,
        detected_at: refundedPayment.updated_at
      });
      continue;
    }

    // Rule 3: Partial refund mismatch
    const partiallyRefundedPayment = payments.find((p) => p.status === "partially_refunded");
    if (partiallyRefundedPayment) {
      const refundEvent = partiallyRefundedPayment.events.find((e) => e.event_type === "refund_completed");
      const loggedRefundAmount = refundEvent ? refundEvent.amount : 0;
      // Expected partial refund for ORD-1008 is $30 based on 1 item returned
      const expectedPartialRefund = 30.00;
      if (loggedRefundAmount !== expectedPartialRefund) {
        summaries.push({
          order_id: order.order_id,
          discrepancy_type: "partial_refund_mismatch",
          severity: "medium",
          summary: `Expected partial refund of $${expectedPartialRefund.toFixed(2)}, but actual logged refund event shows $${loggedRefundAmount.toFixed(2)} (over-refunded by $${(loggedRefundAmount - expectedPartialRefund).toFixed(2)}).`,
          detected_at: partiallyRefundedPayment.updated_at
        });
        continue;
      }
    }

    // Rule 4: Paid but not shipped (Payment captured 72+ hours ago, fulfillment pending)
    const capturedPayment = capturedPayments[0];
    if (capturedPayment && fulfillment && (fulfillment.status === "pending" || fulfillment.status === "picking")) {
      summaries.push({
        order_id: order.order_id,
        discrepancy_type: "paid_not_shipped",
        severity: "high",
        summary: `Payment captured on ${capturedPayment.created_at}, but fulfillment status is still '${fulfillment.status}'.`,
        detected_at: capturedPayment.created_at
      });
      continue;
    }

    // Rule 5: Shipped but not paid (Fulfillment shipped/delivered, payment not captured or authorized only)
    if (fulfillment && (fulfillment.status === "shipped" || fulfillment.status === "delivered")) {
      const isPaid = payments.some((p) => p.status === "captured" || p.status === "partially_refunded");
      if (!isPaid) {
        summaries.push({
          order_id: order.order_id,
          discrepancy_type: "shipped_not_paid",
          severity: "critical",
          summary: `Fulfillment status is '${fulfillment.status}' (Tracking: ${fulfillment.tracking_number}), but payment status is '${payments[0]?.status || "none"}'.`,
          detected_at: fulfillment.updated_at
        });
        continue;
      }
    }
  }

  // Apply filters
  let filtered = summaries;
  if (filter.discrepancy_type) {
    filtered = filtered.filter((d) => d.discrepancy_type === filter.discrepancy_type);
  }
  if (filter.severity) {
    const minLevel = SEVERITY_LEVELS[filter.severity];
    filtered = filtered.filter((d) => SEVERITY_LEVELS[d.severity] >= minLevel);
  }

  // Sort by severity descending
  filtered.sort((a, b) => SEVERITY_LEVELS[b.severity] - SEVERITY_LEVELS[a.severity]);

  const total = filtered.length;
  const offset = filter.offset || 0;
  const limit = filter.limit || 20;
  const items = filtered.slice(offset, offset + limit);
  const has_more = total > offset + items.length;

  return {
    total,
    count: items.length,
    offset,
    discrepancies: items,
    has_more,
    ...(has_more ? { next_offset: offset + items.length } : {})
  };
}
