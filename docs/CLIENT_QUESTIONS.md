# Ops Copilot MCP — Client Scope, Assumptions & Design Clarifications

> Documenting product tradeoffs, scope boundaries, technical assumptions, and design rationale for the Ops Copilot Model Context Protocol (MCP) server.

---

## 1. Domain & Scope Selection

### Q1: Why focus on payment-fulfillment discrepancy detection?
**Answer**: E-commerce operations teams face significant friction when investigating order anomalies across fragmented software stacks (Stripe/PayPal payment gateways, ERP/order management, warehouse WMS, and shipping carriers like DHL/FedEx). These anomalies directly impact revenue and customer satisfaction:
- **Uncollected Revenue**: Orders shipped without captured payment (`shipped_not_paid`).
- **Warehouse Bottlenecks**: Paid orders stuck in picking/pending status for 72+ hours (`paid_not_shipped`).
- **Inventory & Revenue Leakage**: Fully refunded orders that continue moving through transit (`refunded_still_shipping`).
- **Duplicate Charges**: Double-captured payments for a single order (`double_payment`).
- **Accounting Inconsistencies**: Over-refunded partial returns (`partial_refund_mismatch`).

---

## 2. System Boundaries & Read-Only Safety

### Q2: How does the MCP server handle source system mutations?
**Answer**: Source order, payment, and fulfillment data remain strictly **read-only** (`readOnlyHint: true`). Operations tools should diagnose issues without risking accidental modification of underlying billing or shipping records. 

Mutation is restricted exclusively to **escalation creation** (`ops_create_escalation`, `readOnlyHint: false`), which writes a durable human-review ticket to external storage (Upstash Redis REST API).

---

## 3. Authentication & Security Tradeoffs

### Q3: How is authentication handled on the live endpoint?
**Answer**: For submission evaluation and ease of testing via MCP Inspector, the live hosted server (`https://ops-copilot-mcp.vercel.app/mcp`) operates as an unauthenticated public demo endpoint (per client Q&A answer #3). 

In an enterprise multi-tenant environment, the server would enforce OAuth 2.0 / JWT Bearer token validation in the Express middleware layer (`req.headers.authorization`).

---

## 4. Architecture & State Durability

### Q4: How is state preserved across serverless container cold starts?
**Answer**: To avoid serverless memory loss on Vercel Serverless Functions, state durability is decoupled from compute using **Upstash Redis REST API** (`@upstash/redis`). Created escalation tickets (`ESC-400X`) are stored in persistent Redis KV keys (`escalation:ESC-400X`) and indexed in an `escalation_ids` set. This guarantees 100% data preservation across container recycling and redeployments.

---

## 5. Verification & Evaluation

### Q5: How is system behavior verified?
**Answer**: The project includes two levels of verification:
1. **Automated Vitest Suite**: 34 unit and end-to-end integration tests (`npm run test`) verifying tool registration, Zod validation, error handling, and investigation logic.
2. **Evaluation QA Benchmark**: A 10-question evaluation suite (`docs/EVALUATION.xml`) covering complex multi-step operational queries executed against the live server.
