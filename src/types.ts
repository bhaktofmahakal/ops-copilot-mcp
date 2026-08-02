export type OrderStatus = "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  order_id: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total_amount: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = "credit_card" | "paypal" | "bank_transfer";
export type PaymentStatus = "authorized" | "captured" | "failed" | "refunded" | "partially_refunded";

export interface PaymentEvent {
  event_type: "authorized" | "captured" | "refund_initiated" | "refund_completed" | "failed";
  amount: number;
  timestamp: string;
  details: string;
}

export interface Payment {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway_reference: string;
  events: PaymentEvent[];
  created_at: string;
  updated_at: string;
}

export type FulfillmentStatus = "pending" | "picking" | "packed" | "shipped" | "in_transit" | "delivered" | "failed" | "returned";

export interface FulfillmentEvent {
  event_type: "created" | "picking_started" | "packed" | "shipped" | "in_transit" | "delivered" | "failed";
  timestamp: string;
  location: string;
  details: string;
}

export interface Fulfillment {
  fulfillment_id: string;
  order_id: string;
  status: FulfillmentStatus;
  carrier: string;
  tracking_number: string;
  events: FulfillmentEvent[];
  created_at: string;
  updated_at: string;
}

export type DiscrepancyType =
  | "paid_not_shipped"
  | "shipped_not_paid"
  | "refunded_still_shipping"
  | "double_payment"
  | "partial_refund_mismatch";

export type EscalationStatus = "open" | "acknowledged" | "resolved";

export interface EscalationEvidence {
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  timeline_summary: string;
  related_ids: {
    payment_id: string;
    fulfillment_id?: string;
  };
}

export interface Escalation {
  escalation_id: string;
  order_id: string;
  discrepancy_type: DiscrepancyType;
  severity: "low" | "medium" | "high" | "critical";
  diagnosis: string;
  evidence: EscalationEvidence;
  recommended_action: string;
  status: EscalationStatus;
  created_at: string;
  updated_at: string;
}

export interface DiscrepancySummary {
  order_id: string;
  discrepancy_type: DiscrepancyType;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  detected_at: string;
}
