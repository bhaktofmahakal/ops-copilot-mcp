import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

describe("Live Vercel MCP Endpoint Verification", () => {
  it("should connect to live production server, list tools, and execute ops_list_discrepancies", async () => {
    const url = new URL("https://ops-copilot-mcp.vercel.app/mcp");
    const transport = new StreamableHTTPClientTransport(url);
    const client = new Client({ name: "vitest-live-verifier", version: "1.0.0" });

    await client.connect(transport);

    const toolsResponse = await client.listTools();
    expect(toolsResponse.tools.length).toBe(5);

    const toolNames = toolsResponse.tools.map((t) => t.name);
    expect(toolNames).toContain("ops_list_discrepancies");
    expect(toolNames).toContain("ops_get_order_details");

    const result = await client.callTool({
      name: "ops_list_discrepancies",
      arguments: { limit: 5 }
    });

    expect(result.content).toBeDefined();
    expect(result.structuredContent).toBeDefined();

    await transport.close();
  }, 15000);
});
