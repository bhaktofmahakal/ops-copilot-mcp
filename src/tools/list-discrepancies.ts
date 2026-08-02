import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListDiscrepanciesInputSchema } from "../schemas/index.js";
import { detectDiscrepancies } from "../services/discrepancy-detector.js";
import { z } from "zod";

type ListDiscrepanciesInput = z.infer<typeof ListDiscrepanciesInputSchema>;

export function registerListDiscrepanciesTool(server: McpServer) {
  server.registerTool(
    "ops_list_discrepancies",
    {
      title: "List Commerce Discrepancies",
      description: `Scan synthetic commerce data for orders with payment-fulfillment discrepancies.
Returns orders where payment status and fulfillment status are inconsistent
(e.g., paid but not shipped, shipped but not paid, refunded but still in transit).

Use this as the entry point for operational investigation. The results tell you
which orders need attention.

Args:
  - discrepancy_type (string, optional): Filter by type. One of: "paid_not_shipped",
    "shipped_not_paid", "refunded_still_shipping", "double_payment", "partial_refund_mismatch"
  - severity (string, optional): Filter by minimum severity. One of: "low", "medium", "high", "critical"
  - limit (number, optional): Max results, 1-50, default 20
  - offset (number, optional): Pagination offset, default 0

Returns:
  Structured summary list of discrepancies with order_id, discrepancy_type, severity, summary, and detected_at.

Errors:
  - Returns empty list with total=0 if no matching discrepancies found.`,
      inputSchema: ListDiscrepanciesInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: ListDiscrepanciesInput) => {
      try {
        const result = detectDiscrepancies(params);

        if (result.total === 0) {
          const emptyText = "No payment-fulfillment discrepancies found matching the requested filters.";
          return {
            content: [{ type: "text", text: emptyText }],
            structuredContent: result as unknown as Record<string, unknown>
          };
        }

        const lines = [
          `# Payment-Fulfillment Discrepancy Report`,
          `Found ${result.total} total anomalies (showing ${result.count}):`,
          ""
        ];

        for (const d of result.discrepancies) {
          lines.push(`## Order ${d.order_id} [${d.severity.toUpperCase()}]`);
          lines.push(`- **Type**: \`${d.discrepancy_type}\``);
          lines.push(`- **Summary**: ${d.summary}`);
          lines.push(`- **Detected At**: ${d.detected_at}`);
          lines.push(`- **Next Step**: Run \`ops_investigate_discrepancy(order_id: "${d.order_id}")\` for root cause analysis.`);
          lines.push("");
        }

        if (result.has_more) {
          lines.push(`*Note: More results available. Use offset=${result.next_offset} to fetch next page.*`);
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: result as unknown as Record<string, unknown>
        };
      } catch (error) {
        const errorMessage = `Error listing discrepancies: ${error instanceof Error ? error.message : String(error)}`;
        return {
          isError: true,
          content: [{ type: "text", text: errorMessage }]
        };
      }
    }
  );
}
