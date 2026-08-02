import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetOrderDetailsInputSchema } from "../schemas/index.js";
import { getOrderUnifiedDetails } from "../services/investigation-engine.js";
import { z } from "zod";

type GetOrderDetailsInput = z.infer<typeof GetOrderDetailsInputSchema>;

export function registerGetOrderDetailsTool(server: McpServer) {
  server.registerTool(
    "ops_get_order_details",
    {
      title: "Get Order Details",
      description: `Get complete details for a specific order including its payment records,
fulfillment records, and chronological event timeline.

Use this to understand the full state of an order before or during investigation.
Works for any order, not just those with discrepancies.

Args:
  - order_id (string, required): The order ID to look up (e.g., "ORD-1001")

Returns:
  Unified view with order details, payment records with events,
  fulfillment records with events, and a merged chronological timeline.

Errors:
  - Order not found: Returns actionable error if order_id is unknown.`,
      inputSchema: GetOrderDetailsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: GetOrderDetailsInput) => {
      try {
        const details = getOrderUnifiedDetails(params.order_id);

        const lines = [
          `# Order Details: ${details.order.order_id}`,
          `- **Customer**: ${details.order.customer_name} (${details.order.customer_email})`,
          `- **Status**: \`${details.order.status}\``,
          `- **Total**: $${details.order.total_amount.toFixed(2)} ${details.order.currency}`,
          `- **Created At**: ${details.order.created_at}`,
          "",
          `## Purchased Items`
        ];

        for (const item of details.order.items) {
          lines.push(`- ${item.name} (SKU: ${item.sku}) x${item.quantity} @ $${item.unit_price.toFixed(2)}`);
        }

        lines.push("", `## Payment Records (${details.payments.length})`);
        for (const p of details.payments) {
          lines.push(`- **Payment ID**: ${p.payment_id} | **Method**: ${p.method} | **Status**: \`${p.status}\` | **Amount**: $${p.amount.toFixed(2)}`);
        }

        lines.push("", `## Fulfillment Records (${details.fulfillments.length})`);
        for (const f of details.fulfillments) {
          lines.push(`- **Fulfillment ID**: ${f.fulfillment_id} | **Carrier**: ${f.carrier} | **Tracking**: ${f.tracking_number || "N/A"} | **Status**: \`${f.status}\``);
        }

        lines.push("", `## Unified Event Timeline`);
        for (const t of details.timeline) {
          lines.push(`- \`[${t.timestamp}]\` **${t.source.toUpperCase()}** (${t.event_type}): ${t.details}`);
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: details as unknown as Record<string, unknown>
        };
      } catch (error) {
        const errorMessage = `Error: ${error instanceof Error ? error.message : String(error)}`;
        return {
          isError: true,
          content: [{ type: "text", text: errorMessage }]
        };
      }
    }
  );
}
