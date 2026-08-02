import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListDiscrepanciesTool } from "./tools/list-discrepancies.js";
import { registerGetOrderDetailsTool } from "./tools/get-order-details.js";
import { registerInvestigateDiscrepancyTool } from "./tools/investigate-discrepancy.js";
import { registerCreateEscalationTool } from "./tools/create-escalation.js";
import { registerGetEscalationsTool } from "./tools/get-escalations.js";

export const server = new McpServer({
  name: "ops-copilot-mcp-server",
  version: "1.0.0"
});

// Register all 5 MCP tools
registerListDiscrepanciesTool(server);
registerGetOrderDetailsTool(server);
registerInvestigateDiscrepancyTool(server);
registerCreateEscalationTool(server);
registerGetEscalationsTool(server);
