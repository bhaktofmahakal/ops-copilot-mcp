import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetEscalationsInputSchema } from "../schemas/index.js";
import { escalationStore } from "../services/escalation-store.js";
import { z } from "zod";

type GetEscalationsInput = z.infer<typeof GetEscalationsInputSchema>;

export function registerGetEscalationsTool(server: McpServer) {
  server.registerTool(
    "ops_get_escalations",
    {
      title: "Get Escalation History",
      description: `Retrieve escalation records. Can fetch a single escalation by ID or
list all escalations with pagination.

Use this to check whether an order has already been escalated, or to
review the history of escalations.

Args:
  - escalation_id (string, optional): Specific escalation ID to retrieve (e.g., "ESC-4001")
  - order_id (string, optional): Filter escalations by order ID
  - status (string, optional): Filter by status: "open", "acknowledged", "resolved"
  - limit (number, optional): Max results, 1-50, default 20
  - offset (number, optional): Pagination offset, default 0

Returns:
  Single escalation (if escalation_id provided) or paginated list.

Errors:
  - Escalation not found: Returns actionable error if escalation_id does not exist.`,
      inputSchema: GetEscalationsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: GetEscalationsInput) => {
      try {
        if (params.escalation_id) {
          const esc = await escalationStore.getById(params.escalation_id);
          if (!esc) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error: Escalation '${params.escalation_id}' not found. Use ops_get_escalations without escalation_id to list all active escalations.` }]
            };
          }

          const lines = [
            `# Escalation ${esc.escalation_id}`,
            `- **Order ID**: ${esc.order_id}`,
            `- **Discrepancy Type**: \`${esc.discrepancy_type}\``,
            `- **Severity**: \`${esc.severity.toUpperCase()}\``,
            `- **Status**: \`${esc.status}\``,
            `- **Created At**: ${esc.created_at}`,
            "",
            `## Diagnosis`,
            esc.diagnosis,
            "",
            `## Evidence`,
            `- **Order Status**: ${esc.evidence.order_status}`,
            `- **Payment Status**: ${esc.evidence.payment_status}`,
            `- **Fulfillment Status**: ${esc.evidence.fulfillment_status}`,
            `- **Timeline Summary**: ${esc.evidence.timeline_summary}`,
            "",
            `## Recommended Action`,
            esc.recommended_action
          ];

          return {
            content: [{ type: "text", text: lines.join("\n") }],
            structuredContent: { escalation: esc } as Record<string, unknown>
          };
        }

        const listResult = await escalationStore.list({
          order_id: params.order_id,
          status: params.status,
          limit: params.limit,
          offset: params.offset
        });

        if (listResult.total === 0) {
          return {
            content: [{ type: "text", text: "No escalation records found matching the requested filters." }],
            structuredContent: listResult as unknown as Record<string, unknown>
          };
        }

        const lines = [
          `# Escalation History Report`,
          `Found ${listResult.total} total escalations (showing ${listResult.count}):`,
          ""
        ];

        for (const e of listResult.escalations) {
          lines.push(`## ${e.escalation_id} (Order ${e.order_id}) [${e.status.toUpperCase()}]`);
          lines.push(`- **Type**: \`${e.discrepancy_type}\` | **Severity**: \`${e.severity.toUpperCase()}\``);
          lines.push(`- **Diagnosis**: ${e.diagnosis}`);
          lines.push(`- **Action**: ${e.recommended_action}`);
          lines.push(`- **Created At**: ${e.created_at}`);
          lines.push("");
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: listResult as unknown as Record<string, unknown>
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
