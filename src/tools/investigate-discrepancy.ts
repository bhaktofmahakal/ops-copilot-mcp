import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InvestigateDiscrepancyInputSchema } from "../schemas/index.js";
import { investigateOrder } from "../services/investigation-engine.js";
import { z } from "zod";

type InvestigateDiscrepancyInput = z.infer<typeof InvestigateDiscrepancyInputSchema>;

export function registerInvestigateDiscrepancyTool(server: McpServer) {
  server.registerTool(
    "ops_investigate_discrepancy",
    {
      title: "Investigate Order Discrepancy",
      description: `Run automated root-cause analysis on a specific order to diagnose
payment-fulfillment discrepancies.

This tool cross-references the order's payment and fulfillment data,
identifies the discrepancy type, determines severity, builds an evidence
summary, and recommends an action.

Use this after ops_list_discrepancies identifies an order, or directly
if you already know the order ID.

Args:
  - order_id (string, required): The order ID to investigate (e.g., "ORD-1004")

Returns:
  Diagnosis with discrepancy_type, severity, evidence summary, timeline
  analysis, and recommended_action. Returns "no discrepancy detected" for
  healthy orders.

Errors:
  - Order not found: Returns actionable error if order_id is unknown.`,
      inputSchema: InvestigateDiscrepancyInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: InvestigateDiscrepancyInput) => {
      try {
        const result = investigateOrder(params.order_id);

        const lines = [
          `# Automated Diagnosis for Order ${result.order_id}`,
          `- **Discrepancy Detected**: ${result.has_discrepancy ? "YES" : "NO"}`,
          ...(result.has_discrepancy
            ? [
                `- **Discrepancy Type**: \`${result.discrepancy_type}\``,
                `- **Severity**: \`${result.severity?.toUpperCase()}\``
              ]
            : []),
          `- **Investigated At**: ${result.investigated_at}`,
          "",
          `## Diagnosis Finding`,
          result.diagnosis,
          "",
          `## Evidence Summary`,
          `- **Order Status**: ${result.evidence.order_status}`,
          `- **Payment Status**: ${result.evidence.payment_status}`,
          `- **Fulfillment Status**: ${result.evidence.fulfillment_status}`,
          `- **Timeline Summary**: ${result.evidence.timeline_summary}`,
          `- **Related Payment ID**: ${result.evidence.related_ids.payment_id}`,
          `- **Related Fulfillment ID**: ${result.evidence.related_ids.fulfillment_id || "N/A"}`,
          "",
          `## Recommended Action`,
          result.recommended_action
        ];

        if (result.has_discrepancy) {
          lines.push("");
          lines.push(`*Next Step: Call \`ops_create_escalation\` with the diagnosis and evidence to create a durable escalation for human review.*`);
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: result as unknown as Record<string, unknown>
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
