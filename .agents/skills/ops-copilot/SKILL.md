---
name: ops-copilot
description: >-
  Connect, configure, and operate the Ops Copilot MCP server for e-commerce payment-fulfillment discrepancy detection, root-cause investigation, and durable human-review escalations.
---

# Ops Copilot MCP Agent Skill

## Overview

This skill provides step-by-step guidance for AI agents (Antigravity, Codex, OpenCode, Claude Code, Cursor) to configure, connect, test, and operate the **Ops Copilot MCP Server**.

- **Hosted Endpoint**: `https://ops-copilot-mcp.vercel.app/mcp`
- **Health Check Endpoint**: `https://ops-copilot-mcp.vercel.app/health`
- **Local Dev Endpoint**: `http://localhost:3000/mcp`

---

## Client Configuration Reference

To enable an AI client to interact with Ops Copilot MCP, add the appropriate configuration entry:

### 1. Standard MCP JSON Config (Claude Desktop / Cursor / OpenCode / Codex)

```json
{
  "mcpServers": {
    "ops-copilot": {
      "url": "https://ops-copilot-mcp.vercel.app/mcp",
      "transport": "http"
    }
  }
}
```

### 2. Testing via MCP Inspector (No Setup Required)

Run the official MCP Inspector tool to inspect schemas and interactively execute tools:

```bash
npx @modelcontextprotocol/inspector
```
1. Select Transport: **HTTP**
2. Enter URL: `https://ops-copilot-mcp.vercel.app/mcp`
3. Click **Connect**

---

## Tool Reference & Operational Workflows

The Ops Copilot MCP server exposes 5 purpose-built operational tools. Always follow the standard 5-step operational workflow when investigating e-commerce issues:

```
[ops_list_discrepancies] -> [ops_get_order_details] -> [ops_investigate_discrepancy] -> [ops_create_escalation] -> [ops_get_escalations]
```

### 1. `ops_list_discrepancies`
- **Purpose**: Scan synthetic orders to find payment-fulfillment anomalies.
- **Key Parameters**:
  - `discrepancy_type` (optional): `paid_not_shipped`, `shipped_not_paid`, `refunded_still_shipping`, `double_payment`, `partial_refund_mismatch`
  - `severity` (optional): `low`, `medium`, `high`, `critical`
  - `limit` (optional): max 50

### 2. `ops_get_order_details`
- **Purpose**: Retrieve unified, cross-system timeline joining orders, payments, and fulfillment events.
- **Key Parameters**:
  - `order_id` (required): e.g. `ORD-1004`

### 3. `ops_investigate_discrepancy`
- **Purpose**: Execute rule-based diagnostic analysis to determine root cause and recommended remediation.
- **Key Parameters**:
  - `order_id` (required): e.g. `ORD-1004`

### 4. `ops_create_escalation`
- **Purpose**: Persist a durable human-review escalation ticket in Redis storage.
- **Key Parameters**:
  - `order_id` (required)
  - `discrepancy_type` (required)
  - `severity` (required)
  - `diagnosis` (required)
  - `evidence` (required object)
  - `recommended_action` (required)

### 5. `ops_get_escalations`
- **Purpose**: Query active or past escalation tickets from Redis storage.
- **Key Parameters**:
  - `escalation_id` or `order_id` (optional)
  - `status` (optional): `open`, `in_review`, `resolved`

---

## Testing & Verification Protocol

### Run Automated Vitest Suite
```bash
npm run test
```
- Expect **35/35 passing tests**.

### Build Verification
```bash
npm run build
```
- Expect clean TypeScript build (`dist/index.js`).

---

## Common Pitfalls & Best Practices

1. **Read-Only vs Mutation**: Only `ops_create_escalation` mutates state (persists ticket to Redis). All other 4 tools are read-only (`readOnlyHint: true`).
2. **Order ID Format**: Always use standard `ORD-XXXX` format for order IDs.
3. **State Durability**: Escalation tickets persist in Upstash Redis REST storage, surviving serverless cold starts.
