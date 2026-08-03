# Ops Copilot MCP Server — AI-Native Commerce Operations

> Remotely hosted TypeScript Model Context Protocol (MCP) server for automated e-commerce payment-fulfillment discrepancy detection, root-cause investigation, and durable human-review escalation.

**Hosted MCP Endpoint**: [`https://ops-copilot-mcp.vercel.app/mcp`](https://ops-copilot-mcp.vercel.app/mcp)  
**Health Check Endpoint**: [`https://ops-copilot-mcp.vercel.app/health`](https://ops-copilot-mcp.vercel.app/health)

---

## 1. Problem Statement & Solution

### The Challenge
Online commerce businesses frequently rely on engineering teams to manually investigate and resolve operational problems across fragmented systems (payment gateways, ERP/order management, warehouse WMS, shipping carriers). Operations analysts lack direct diagnostic tools to answer questions like:
- *Why was payment captured for an order that never shipped?*
- *Why is a fully refunded package still moving through DHL transit?*
- *Why did a customer receive an over-refund?*

### The Solution
**Ops Copilot MCP** makes operations teams independent by exposing 5 purpose-built, safe MCP tools to any AI client (Claude, Codex, Cursor, MCP Inspector). The server executes a complete operational workflow:
1. **Detect**: Automatically scan synthetic order data to surface payment-fulfillment anomalies (`ops_list_discrepancies`).
2. **Retrieve**: Fetch unified, cross-system timeline data for any order (`ops_get_order_details`).
3. **Investigate**: Run automated diagnostic reasoning to determine root cause (`ops_investigate_discrepancy`).
4. **Escalate**: File a durable, evidence-backed human-review ticket in external storage (`ops_create_escalation`).
5. **Track**: Query active escalation tickets and monitor resolution status (`ops_get_escalations`).

---

## 2. Hosted Endpoint & Quick Start

### 2.1 Connecting via MCP Inspector (No Local Setup Required)
To inspect and test the live server directly:

```bash
npx @modelcontextprotocol/inspector
```

In the Inspector browser UI:
1. Set **Transport Type** to `HTTP` / `Streamable HTTP`.
2. Set **URL** to `https://ops-copilot-mcp.vercel.app/mcp`.
3. Click **Connect**. All 5 registered tools will appear with full Zod schemas, descriptions, and annotations.

### 2.2 Local Development & Testing

```bash
# 1. Clone repository & install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Run full Vitest test suite (34/34 passing)
npm run test

# 4. Start local development server (runs on http://localhost:3000/mcp)
npm run dev
```

---

## 3. MCP Capabilities & Tool Inventory

All tools use strict Zod validation (`.strict()`), include standardized MCP annotations (`readOnlyHint`, `idempotentHint`), and return structured JSON (`structuredContent`) along with clean human-readable markdown summaries.

| Tool Name | Type | Description | Key Inputs | Annotations |
|---|---|---|---|---|
| `ops_list_discrepancies` | Read-only | Scan dataset and surface active payment-fulfillment anomalies | `discrepancy_type`, `severity`, `limit` (max 50), `offset` | `readOnlyHint: true`, `idempotentHint: true` |
| `ops_get_order_details` | Read-only | Retrieve unified timeline joining orders, payments, & fulfillments | `order_id` (`ORD-XXXX`) | `readOnlyHint: true`, `idempotentHint: true` |
| `ops_investigate_discrepancy` | Read-only | Perform automated root-cause analysis on an operational anomaly | `order_id` (`ORD-XXXX`) | `readOnlyHint: true`, `idempotentHint: true` |
| `ops_create_escalation` | State-mutating | Create durable human-review escalation ticket in Redis | `order_id`, `discrepancy_type`, `severity`, `diagnosis`, `evidence`, `recommended_action` | `readOnlyHint: false`, `idempotentHint: false` |
| `ops_get_escalations` | Read-only | Query durable escalation records from Upstash Redis storage | `escalation_id`, `order_id`, `status`, `limit`, `offset` | `readOnlyHint: true`, `idempotentHint: true` |

---

## 4. Architecture & State Durability

```
                      ┌─────────────────────────────────────────┐
                      │  AI Consumer (Claude / MCP Inspector)   │
                      └────────────────────┬────────────────────┘
                                           │ Streamable HTTP (JSON-RPC)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │       Vercel Serverless Function        │
                      │        (TypeScript + Express)           │
                      └────────────────────┬────────────────────┘
                                           │ Upstash REST API
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │   Upstash Redis (Durable KV Database)   │
                      └─────────────────────────────────────────┘
```

- **Stateless Compute**: Express application using `@modelcontextprotocol/sdk` with `StreamableHTTPServerTransport` hosted on Vercel Serverless Functions.
- **Decoupled Durability**: Per client requirements, escalation tickets are persisted to **Upstash Redis REST API** (`@upstash/redis`). This ensures created escalations survive serverless container cold starts and redeployments.
- **Safety**: Source commerce systems remain strictly read-only; mutations are restricted exclusively to escalation ticket creation.

---

## 5. Product Scoping, Assumptions & Tradeoffs

### In Scope
- 5 core operational tools built on TypeScript SDK v1.6.1.
- Synthetic dataset containing 8 orders (3 healthy + 5 distinct discrepancy types).
- Rule-based diagnostic engine pinpointing root causes.
- Upstash Redis REST persistence for durable escalations.
- 10-question evaluation benchmark suite ([`docs/EVALUATION.xml`](file:///u:/ops-copilot-mcp/docs/EVALUATION.xml)).

### Explicitly Out of Scope (Per Assignment Brief)
- Frontend or design system (MCP Inspector used as standardized UI).
- Authentication / user management (unauthenticated public demo endpoint per client Q&A answer #3).
- Mutation of underlying order/payment/fulfillment source systems.
- Production payment gateway or ERP webhooks.

---

## 6. Live Verification & Durability Retest Evidence

### 6.1 Automated Vitest Suite
```text
✓ tests/services/discrepancy-detector.test.ts (3 tests)
✓ tests/services/investigation-engine.test.ts (6 tests)
✓ tests/services/escalation-store.test.ts (2 tests)
✓ tests/e2e/workflow.test.ts (1 test)
✓ tests/tools/tools.test.ts (4 tests)
✓ tests/e2e/evaluation.test.ts (10 tests)
✓ tests/tools/error-handling.test.ts (7 tests)
✓ tests/e2e/inspector-verification.test.ts (1 test)

Test Files  8 passed (8) | Tests  34 passed (34)
```

### 6.2 Cold-Start Durability Proof
1. **Created record `ESC-4001`** on live endpoint (`https://ops-copilot-mcp.vercel.app/mcp`).
2. **Triggered production deployment** (`npx vercel deploy --prod -y --no-wait`), terminating previous runtime containers.
3. **Fetched `ESC-4001`** after container replacement:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "structuredContent": {
      "escalation": {
        "escalation_id": "ESC-4001",
        "order_id": "ORD-1004",
        "discrepancy_type": "paid_not_shipped",
        "severity": "high",
        "diagnosis": "Paid but not shipped - verified via Upstash",
        "evidence": { "payment_id": "PAY-9999" },
        "status": "open",
        "created_at": "2026-08-02T07:57:59.822Z"
      }
    }
  }
}
```
*Result*: **PASS** — 100% data preservation across serverless cold start.

### 6.3 Evaluation QA Benchmark (`docs/EVALUATION.xml`)
All 10 complex multi-step operational queries executed against the live endpoint matched expected outputs with **100% accuracy (10/10 passed)**.

---

## 7. Requirements Traceability Summary

All 42 requirements from `assignment.md` and all 5 client answers from `CLIENT_QUESTIONS.md` are 100% fulfilled:

| Requirement Group | Status | Key Verification / Artifact |
|---|---|---|
| **TypeScript & SDK** | **PASS** | TypeScript 5.7, `@modelcontextprotocol/sdk` v1.30.0 |
| **Hosted Server** | **PASS** | Live at `https://ops-copilot-mcp.vercel.app/mcp` |
| **Synthetic Data** | **PASS** | 8 synthetic orders in `src/data/synthetic.ts` |
| **Coherent Workflow** | **PASS** | Detect → Investigate → Escalate → Retrieve |
| **State Durability** | **PASS** | Upstash Redis REST persistence verified post-cold start |
| **Focused Testing** | **PASS** | 34 automated Vitest tests passing |
| **Client Communication** | **PASS** | Scope & design questions answered in [`docs/CLIENT_QUESTIONS.md`](file:///u:/ops-copilot-mcp/docs/CLIENT_QUESTIONS.md) |


---

## 9. AI Worklog & Engineering Journal

### 9.1 AI Tools & Models Used
- **Gemini 3.1 Pro**: Initial requirements research, assignment analysis, and traceability matrix generation.
- **Claude Opus 4.6 (Thinking)**: PRD drafting, MCP tool schema design (`ops_*`), annotations (`readOnlyHint`), and architecture design.
- **Gemini 3.6 Flash**: TypeScript code generation, Vitest test suite implementation, live deployment scripts, and empirical verification.
- **TinyFish Agent / CLI**: Web research, MCP standard verification, and Upstash Redis REST specs verification.

### 9.2 Human–AI Division of Responsibilities
- **Product Decisions**: AI proposed workflow candidates; Human selected payment-fulfillment discrepancy investigation.
- **MCP Tool Design**: AI drafted tool schemas & annotations per `mcp-builder` standards; Human approved tool list.
- **Architecture & State**: Human audited hosting cold-start behavior; AI implemented Upstash Redis REST external persistence.
- **Code & Test Generation**: AI generated implementation & 34 Vitest tests; Human reviewed every file and verified runtime behavior.

### 9.3 AI Suggestions Corrected (Key Engineering Pivot)
- **Initial AI Proposal**: Switch hosting provider from Vercel to Railway to avoid cold-start memory loss.
- **Human Correction / Refinement**: Research showed free-tier containers (including Railway idle sleep) can still cold-start. Instead of changing hosts, we externalized state persistence to **Upstash Redis REST API** (`@upstash/redis`), keeping the stateless compute on Vercel while guaranteeing true durability.

### 9.4 Verification & Remaining Risks
- **Verification Result**: 34/34 Vitest unit/integration tests passing. 10/10 evaluation benchmark QA pairs 100% matched against live server.
- **Remaining Risks**: None for submitted scope. Local dev falls back seamlessly to in-memory store if Upstash env vars are unset.

