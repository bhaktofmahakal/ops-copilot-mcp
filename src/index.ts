import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { server } from "./server.js";

const app = express();
app.use(express.json());

// Stateless Streamable HTTP transport
app.post("/mcp", async (req: Request, res: Response) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on("close", () => {
    transport.close().catch((err) => {
      console.error("Error closing transport:", err);
    });
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: "ops-copilot-mcp-server", version: "1.0.0" });
});

const PORT = parseInt(process.env.PORT || "3000", 10);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.error(`Ops Copilot MCP Server running on http://localhost:${PORT}/mcp`);
  });
}

export { app };
export default app;
