import { Order, Payment, Fulfillment } from "../types.js";

export const ORDERS: Order[] = [
  {
    order_id: "ORD-1001",
    customer_name: "Jane Cooper",
    customer_email: "jane.cooper@example.com",
    items: [{ sku: "SKU-A100", name: "Wireless Headphones", quantity: 1, unit_price: 149.99 }],
    total_amount: 149.99,
    currency: "USD",
    status: "delivered",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-12T14:30:00Z"
  },
  {
    order_id: "ORD-1002",
    customer_name: "Wade Warren",
    customer_email: "wade.warren@example.com",
    items: [{ sku: "SKU-B200", name: "Ergonomic Keyboard", quantity: 1, unit_price: 89.50 }],
    total_amount: 89.50,
    currency: "USD",
    status: "shipped",
    created_at: "2024-01-14T11:20:00Z",
    updated_at: "2024-01-15T08:10:00Z"
  },
  {
    order_id: "ORD-1003",
    customer_name: "Esther Howard",
    customer_email: "esther.howard@example.com",
    items: [{ sku: "SKU-C300", name: "USB-C Hub", quantity: 2, unit_price: 25.00 }],
    total_amount: 50.00,
    currency: "USD",
    status: "confirmed",
    created_at: "2024-01-16T15:45:00Z",
    updated_at: "2024-01-16T15:45:00Z"
  },
  {
    order_id: "ORD-1004",
    customer_name: "Cameron Williamson",
    customer_email: "cameron.w@example.com",
    items: [{ sku: "SKU-D400", name: "4K Monitor Stand", quantity: 1, unit_price: 199.99 }],
    total_amount: 199.99,
    currency: "USD",
    status: "processing",
    created_at: "2024-01-11T10:00:00Z",
    updated_at: "2024-01-11T10:05:00Z"
  },
  {
    order_id: "ORD-1005",
    customer_name: "Brooklyn Simmons",
    customer_email: "brooklyn.s@example.com",
    items: [{ sku: "SKU-E500", name: "Noise Cancelling Earbuds", quantity: 1, unit_price: 129.00 }],
    total_amount: 129.00,
    currency: "USD",
    status: "shipped",
    created_at: "2024-01-12T08:30:00Z",
    updated_at: "2024-01-13T10:00:00Z"
  },
  {
    order_id: "ORD-1006",
    customer_name: "Leslie Alexander",
    customer_email: "leslie.a@example.com",
    items: [{ sku: "SKU-F600", name: "Smart Watch Strap", quantity: 2, unit_price: 35.00 }],
    total_amount: 70.00,
    currency: "USD",
    status: "processing",
    created_at: "2024-01-13T14:00:00Z",
    updated_at: "2024-01-14T09:00:00Z"
  },
  {
    order_id: "ORD-1007",
    customer_name: "Guy Hawkins",
    customer_email: "guy.hawkins@example.com",
    items: [{ sku: "SKU-G700", name: "Mechanical Gaming Mouse", quantity: 1, unit_price: 79.99 }],
    total_amount: 79.99,
    currency: "USD",
    status: "processing",
    created_at: "2024-01-14T16:00:00Z",
    updated_at: "2024-01-14T16:05:00Z"
  },
  {
    order_id: "ORD-1008",
    customer_name: "Kristin Watson",
    customer_email: "kristin.watson@example.com",
    items: [
      { sku: "SKU-H800", name: "Desk Lamp", quantity: 1, unit_price: 50.00 },
      { sku: "SKU-H801", name: "Bluetooth Speaker", quantity: 1, unit_price: 100.00 }
    ],
    total_amount: 150.00,
    currency: "USD",
    status: "shipped",
    created_at: "2024-01-09T10:00:00Z",
    updated_at: "2024-01-11T11:00:00Z"
  }
];

export const PAYMENTS: Payment[] = [
  {
    payment_id: "PAY-2001",
    order_id: "ORD-1001",
    amount: 149.99,
    currency: "USD",
    method: "credit_card",
    status: "captured",
    gateway_reference: "ch_1001_abc",
    events: [
      { event_type: "authorized", amount: 149.99, timestamp: "2024-01-10T09:01:00Z", details: "Card authorized" },
      { event_type: "captured", amount: 149.99, timestamp: "2024-01-10T09:02:00Z", details: "Payment captured" }
    ],
    created_at: "2024-01-10T09:01:00Z",
    updated_at: "2024-01-10T09:02:00Z"
  },
  {
    payment_id: "PAY-2002",
    order_id: "ORD-1002",
    amount: 89.50,
    currency: "USD",
    method: "paypal",
    status: "captured",
    gateway_reference: "pay_1002_def",
    events: [
      { event_type: "captured", amount: 89.50, timestamp: "2024-01-14T11:21:00Z", details: "PayPal capture success" }
    ],
    created_at: "2024-01-14T11:21:00Z",
    updated_at: "2024-01-14T11:21:00Z"
  },
  {
    payment_id: "PAY-2003",
    order_id: "ORD-1003",
    amount: 50.00,
    currency: "USD",
    method: "credit_card",
    status: "authorized",
    gateway_reference: "ch_1003_ghi",
    events: [
      { event_type: "authorized", amount: 50.00, timestamp: "2024-01-16T15:46:00Z", details: "Card authorized pending capture" }
    ],
    created_at: "2024-01-16T15:46:00Z",
    updated_at: "2024-01-16T15:46:00Z"
  },
  {
    // Discrepancy: Paid but not shipped (captured 72h+ ago)
    payment_id: "PAY-2004",
    order_id: "ORD-1004",
    amount: 199.99,
    currency: "USD",
    method: "credit_card",
    status: "captured",
    gateway_reference: "ch_1004_jkl",
    events: [
      { event_type: "authorized", amount: 199.99, timestamp: "2024-01-11T10:01:00Z", details: "Card authorized" },
      { event_type: "captured", amount: 199.99, timestamp: "2024-01-11T10:02:00Z", details: "Payment captured successfully" }
    ],
    created_at: "2024-01-11T10:01:00Z",
    updated_at: "2024-01-11T10:02:00Z"
  },
  {
    // Discrepancy: Shipped but not paid (status authorized only, never captured)
    payment_id: "PAY-2005",
    order_id: "ORD-1005",
    amount: 129.00,
    currency: "USD",
    method: "credit_card",
    status: "authorized",
    gateway_reference: "ch_1005_mno",
    events: [
      { event_type: "authorized", amount: 129.00, timestamp: "2024-01-12T08:31:00Z", details: "Authorization hold placed" }
    ],
    created_at: "2024-01-12T08:31:00Z",
    updated_at: "2024-01-12T08:31:00Z"
  },
  {
    // Discrepancy: Refunded but still shipping
    payment_id: "PAY-2006",
    order_id: "ORD-1006",
    amount: 70.00,
    currency: "USD",
    method: "credit_card",
    status: "refunded",
    gateway_reference: "ch_1006_pqr",
    events: [
      { event_type: "captured", amount: 70.00, timestamp: "2024-01-13T14:01:00Z", details: "Captured" },
      { event_type: "refund_initiated", amount: 70.00, timestamp: "2024-01-14T08:00:00Z", details: "Customer support requested refund" },
      { event_type: "refund_completed", amount: 70.00, timestamp: "2024-01-14T08:05:00Z", details: "Full refund issued" }
    ],
    created_at: "2024-01-13T14:01:00Z",
    updated_at: "2024-01-14T08:05:00Z"
  },
  {
    // Discrepancy: Double payment (two captured payments for same order)
    payment_id: "PAY-2007-A",
    order_id: "ORD-1007",
    amount: 79.99,
    currency: "USD",
    method: "credit_card",
    status: "captured",
    gateway_reference: "ch_1007_stu1",
    events: [
      { event_type: "captured", amount: 79.99, timestamp: "2024-01-14T16:01:00Z", details: "First capture" }
    ],
    created_at: "2024-01-14T16:01:00Z",
    updated_at: "2024-01-14T16:01:00Z"
  },
  {
    payment_id: "PAY-2007-B",
    order_id: "ORD-1007",
    amount: 79.99,
    currency: "USD",
    method: "credit_card",
    status: "captured",
    gateway_reference: "ch_1007_stu2",
    events: [
      { event_type: "captured", amount: 79.99, timestamp: "2024-01-14T16:02:00Z", details: "Duplicate capture on retry" }
    ],
    created_at: "2024-01-14T16:02:00Z",
    updated_at: "2024-01-14T16:02:00Z"
  },
  {
    // Discrepancy: Partial refund mismatch (Expected partial refund $30, actual logged refund event $50)
    payment_id: "PAY-2008",
    order_id: "ORD-1008",
    amount: 150.00,
    currency: "USD",
    method: "credit_card",
    status: "partially_refunded",
    gateway_reference: "ch_1008_vwx",
    events: [
      { event_type: "captured", amount: 150.00, timestamp: "2024-01-09T10:01:00Z", details: "Full payment captured" },
      { event_type: "refund_completed", amount: 50.00, timestamp: "2024-01-10T11:00:00Z", details: "Logged partial refund of $50 (Expected refund was $30 for 1 returned item)" }
    ],
    created_at: "2024-01-09T10:01:00Z",
    updated_at: "2024-01-10T11:00:00Z"
  }
];

export const FULFILLMENTS: Fulfillment[] = [
  {
    fulfillment_id: "FUL-3001",
    order_id: "ORD-1001",
    status: "delivered",
    carrier: "FedEx",
    tracking_number: "FX100199",
    events: [
      { event_type: "created", timestamp: "2024-01-10T10:00:00Z", location: "Warehouse A", details: "Fulfillment created" },
      { event_type: "shipped", timestamp: "2024-01-11T08:00:00Z", location: "Distribution Center", details: "Handed over to carrier" },
      { event_type: "delivered", timestamp: "2024-01-12T14:30:00Z", location: "Customer Address", details: "Delivered to porch" }
    ],
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-01-12T14:30:00Z"
  },
  {
    fulfillment_id: "FUL-3002",
    order_id: "ORD-1002",
    status: "shipped",
    carrier: "UPS",
    tracking_number: "1Z100288",
    events: [
      { event_type: "created", timestamp: "2024-01-14T12:00:00Z", location: "Warehouse B", details: "Picking finished" },
      { event_type: "shipped", timestamp: "2024-01-15T08:10:00Z", location: "Hub 4", details: "In transit" }
    ],
    created_at: "2024-01-14T12:00:00Z",
    updated_at: "2024-01-15T08:10:00Z"
  },
  {
    fulfillment_id: "FUL-3003",
    order_id: "ORD-1003",
    status: "pending",
    carrier: "FedEx",
    tracking_number: "",
    events: [
      { event_type: "created", timestamp: "2024-01-16T16:00:00Z", location: "Warehouse A", details: "Queued for fulfillment" }
    ],
    created_at: "2024-01-16T16:00:00Z",
    updated_at: "2024-01-16T16:00:00Z"
  },
  {
    // Discrepancy: Paid but not shipped (stuck in pending 72h+)
    fulfillment_id: "FUL-3004",
    order_id: "ORD-1004",
    status: "pending",
    carrier: "FedEx",
    tracking_number: "",
    events: [
      { event_type: "created", timestamp: "2024-01-11T10:10:00Z", location: "Warehouse A", details: "Fulfillment ticket created but unassigned" }
    ],
    created_at: "2024-01-11T10:10:00Z",
    updated_at: "2024-01-11T10:10:00Z"
  },
  {
    // Discrepancy: Shipped but not paid
    fulfillment_id: "FUL-3005",
    order_id: "ORD-1005",
    status: "shipped",
    carrier: "DHL",
    tracking_number: "DHL100577",
    events: [
      { event_type: "created", timestamp: "2024-01-12T09:00:00Z", location: "Warehouse A", details: "Packed" },
      { event_type: "shipped", timestamp: "2024-01-13T10:00:00Z", location: "Air Freight", details: "Shipped out" }
    ],
    created_at: "2024-01-12T09:00:00Z",
    updated_at: "2024-01-13T10:00:00Z"
  },
  {
    // Discrepancy: Refunded but still shipping
    fulfillment_id: "FUL-3006",
    order_id: "ORD-1006",
    status: "shipped",
    carrier: "USPS",
    tracking_number: "9400100666",
    events: [
      { event_type: "shipped", timestamp: "2024-01-14T09:00:00Z", location: "Post Office", details: "Out for delivery" }
    ],
    created_at: "2024-01-13T15:00:00Z",
    updated_at: "2024-01-14T09:00:00Z"
  },
  {
    // Discrepancy: Double payment
    fulfillment_id: "FUL-3007",
    order_id: "ORD-1007",
    status: "pending",
    carrier: "FedEx",
    tracking_number: "",
    events: [
      { event_type: "created", timestamp: "2024-01-14T16:10:00Z", location: "Warehouse A", details: "Awaiting single payment clearance check" }
    ],
    created_at: "2024-01-14T16:10:00Z",
    updated_at: "2024-01-14T16:10:00Z"
  },
  {
    // Discrepancy: Partial refund mismatch
    fulfillment_id: "FUL-3008",
    order_id: "ORD-1008",
    status: "shipped",
    carrier: "FedEx",
    tracking_number: "FX100855",
    events: [
      { event_type: "shipped", timestamp: "2024-01-11T11:00:00Z", location: "Regional Hub", details: "Item 1 shipped, Item 2 returned in warehouse" }
    ],
    created_at: "2024-01-09T11:00:00Z",
    updated_at: "2024-01-11T11:00:00Z"
  }
];
