import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/index.js";
import { Server } from "http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

describe("MCP Server Streamable HTTP & Tool Inspection", () => {
  let serverInstance: Server;
  let port: number;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const addr = serverInstance.address();
        if (addr && typeof addr !== "string") {
          port = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (serverInstance) {
        serverInstance.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  it("should initialize client and discover all 5 tools with descriptions and annotations", async () => {
    const transport = new StreamableHTTPClientTransport(new URL(`http://localhost:${port}/mcp`));
    const client = new Client({ name: "vitest-inspector-client", version: "1.0.0" });

    await client.connect(transport);

    const toolsResponse = await client.listTools();
    expect(toolsResponse.tools.length).toBe(5);

    const toolNames = toolsResponse.tools.map((t) => t.name);
    expect(toolNames).toEqual([
      "ops_list_discrepancies",
      "ops_get_order_details",
      "ops_investigate_discrepancy",
      "ops_create_escalation",
      "ops_get_escalations"
    ]);

    for (const tool of toolsResponse.tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.annotations).toBeDefined();
    }
  });
});
