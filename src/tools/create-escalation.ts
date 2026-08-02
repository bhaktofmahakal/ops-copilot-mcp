import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateEscalationInputSchema } from "../schemas/index.js";
import { escalationStore } from "../services/escalation-store.js";
import { ORDERS } from "../data/synthetic.js";
import { z } from "zod";

type CreateEscalationInput = z.infer<typeof CreateEscalationInputSchema>;

export function registerCreateEscalationTool(server: McpServer) {
  server.registerTool(
    "ops_create_escalation",
    {
      title: "Create Human-Review Escalation",
      description: `Create a durable escalation record for an order that needs human review.
The escalation captures the diagnosis, evidence, and recommended action
so the fulfillment or finance team can act without re-investigating.

This is the ONLY tool that creates data. It writes to the persistent escalation
store (Upstash Redis REST API), not to the source order/payment/fulfillment systems.

Tip: Run ops_investigate_discrepancy first to get the diagnosis, then
pass that information into this tool.

Args:
  - order_id (string, required): The order ID to escalate
  - discrepancy_type (string, required): Type of discrepancy detected
  - severity (string, required): "low" | "medium" | "high" | "critical"
  - diagnosis (string, required): Summary of what was found
  - evidence (object, required): Supporting evidence object
  - recommended_action (string, required): What the human reviewer should do

Returns:
  The created escalation record with a unique escalation_id and status "open".

Errors:
  - Validates order_id exists before creating escalation.`,
      inputSchema: CreateEscalationInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: CreateEscalationInput) => {
      try {
        const orderExists = ORDERS.some((o) => o.order_id === params.order_id);
        if (!orderExists) {
          return {
            isError: true,
            content: [{ type: "text", text: `Error: Order '${params.order_id}' not found. Cannot create escalation for non-existent order.` }]
          };
        }

        const escalation = await escalationStore.create(params);

        const lines = [
          `# Escalation Record Created Successfully`,
          `- **Escalation ID**: \`${escalation.escalation_id}\``,
          `- **Order ID**: ${escalation.order_id}`,
          `- **Discrepancy Type**: \`${escalation.discrepancy_type}\``,
          `- **Severity**: \`${escalation.severity.toUpperCase()}\``,
          `- **Status**: \`${escalation.status}\``,
          `- **Created At**: ${escalation.created_at}`,
          "",
          `## Diagnosis Summary`,
          escalation.diagnosis,
          "",
          `## Action Plan`,
          escalation.recommended_action,
          "",
          `*Record is durably stored and retrievable via \`ops_get_escalations(escalation_id: "${escalation.escalation_id}")\`.*`
        ];

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: escalation as unknown as Record<string, unknown>
        };
      } catch (error) {
        const errorMessage = `Error creating escalation: ${error instanceof Error ? error.message : String(error)}`;
        return {
          isError: true,
          content: [{ type: "text", text: errorMessage }]
        };
      }
    }
  );
}
