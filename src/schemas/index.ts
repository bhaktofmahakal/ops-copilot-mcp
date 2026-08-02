import { z } from "zod";

export const DiscrepancyTypeEnum = z.enum([
  "paid_not_shipped",
  "shipped_not_paid",
  "refunded_still_shipping",
  "double_payment",
  "partial_refund_mismatch"
]);

export const SeverityEnum = z.enum(["low", "medium", "high", "critical"]);
export const EscalationStatusEnum = z.enum(["open", "acknowledged", "resolved"]);

export const ListDiscrepanciesInputSchema = z.object({
  discrepancy_type: DiscrepancyTypeEnum.optional().describe("Filter by discrepancy type"),
  severity: SeverityEnum.optional().describe("Filter by minimum severity"),
  limit: z.number().int().min(1).max(50).default(20).describe("Maximum results to return"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset")
}).strict();

export const GetOrderDetailsInputSchema = z.object({
  order_id: z.string()
    .regex(/^ORD-\d+$/, "Order ID must match format ORD-XXXX (e.g., ORD-1001)")
    .describe("The order ID to look up")
}).strict();

export const InvestigateDiscrepancyInputSchema = z.object({
  order_id: z.string()
    .regex(/^ORD-\d+$/, "Order ID must match format ORD-XXXX")
    .describe("The order ID to investigate")
}).strict();

export const CreateEscalationInputSchema = z.object({
  order_id: z.string()
    .regex(/^ORD-\d+$/, "Order ID must match format ORD-XXXX")
    .describe("The order to escalate"),
  discrepancy_type: DiscrepancyTypeEnum.describe("Type of discrepancy"),
  severity: SeverityEnum.describe("Severity level"),
  diagnosis: z.string().min(10).max(2000).describe("Summary of the diagnosis findings"),
  evidence: z.object({
    order_status: z.string(),
    payment_status: z.string(),
    fulfillment_status: z.string(),
    timeline_summary: z.string(),
    related_ids: z.object({
      payment_id: z.string(),
      fulfillment_id: z.string().optional()
    })
  }).describe("Supporting evidence from investigation"),
  recommended_action: z.string().min(10).max(1000).describe("Recommended next step for human reviewer")
}).strict();

export const GetEscalationsInputSchema = z.object({
  escalation_id: z.string()
    .regex(/^ESC-\d+$/, "Escalation ID must match format ESC-XXXX")
    .optional()
    .describe("Specific escalation ID to retrieve"),
  order_id: z.string()
    .regex(/^ORD-\d+$/, "Order ID must match format ORD-XXXX")
    .optional()
    .describe("Filter by order ID"),
  status: EscalationStatusEnum.optional().describe("Filter by escalation status"),
  limit: z.number().int().min(1).max(50).default(20).describe("Maximum results to return"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset")
}).strict();
