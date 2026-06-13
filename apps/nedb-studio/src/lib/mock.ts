import type { Field, FieldType, NEDBScaffold } from "./types";
import { finalizeScaffold, type ScaffoldCore } from "./scaffold";

/**
 * Deterministic mock generation. When AiAssist credentials are absent, the studio
 * runs entirely on these templates — fully usable, no network, no key. They are
 * also the fallback if a live generation fails validation twice.
 *
 * Every template is referentially valid: relations/indexes/seed reference real
 * collections and fields, so validateScaffold() passes.
 */

const f = (name: string, type: FieldType, required = false, description = ""): Field => ({
  name,
  type,
  required,
  description,
});

// ── Contractor CRM ───────────────────────────────────────────────────────────
const contractorCrm: ScaffoldCore = {
  appName: "Contractor CRM",
  description:
    "Client, project, work-order, and invoice tracking for a field-services contractor.",
  collections: [
    { name: "clients", fields: [f("id", "string", true), f("name", "string", true), f("email", "string"), f("phone", "string"), f("address", "string"), f("created_at", "datetime")] },
    { name: "projects", fields: [f("id", "string", true), f("client_id", "reference", true, "-> clients"), f("title", "string", true), f("status", "string"), f("budget", "number"), f("start_date", "datetime")] },
    { name: "work_orders", fields: [f("id", "string", true), f("project_id", "reference", true, "-> projects"), f("technician_id", "reference", false, "-> technicians"), f("description", "string"), f("status", "string"), f("scheduled_for", "datetime"), f("hours", "number")] },
    { name: "invoices", fields: [f("id", "string", true), f("project_id", "reference", true, "-> projects"), f("amount", "number", true), f("status", "string"), f("issued_at", "datetime"), f("due_at", "datetime")] },
    { name: "technicians", fields: [f("id", "string", true), f("name", "string", true), f("trade", "string"), f("phone", "string"), f("active", "boolean")] },
  ],
  relations: [
    { from: "clients", relation: "owns", to: "projects", cardinality: "one_to_many" },
    { from: "projects", relation: "contains", to: "work_orders", cardinality: "one_to_many" },
    { from: "technicians", relation: "assigned_to", to: "work_orders", cardinality: "one_to_many" },
    { from: "projects", relation: "billed_by", to: "invoices", cardinality: "one_to_many" },
  ],
  indexes: [
    { collection: "clients", field: "email", kind: "eq" },
    { collection: "clients", field: "name", kind: "search" },
    { collection: "projects", field: "status", kind: "eq" },
    { collection: "projects", field: "client_id", kind: "eq" },
    { collection: "projects", field: "start_date", kind: "ordered" },
    { collection: "work_orders", field: "status", kind: "eq" },
    { collection: "work_orders", field: "project_id", kind: "eq" },
    { collection: "invoices", field: "status", kind: "eq" },
    { collection: "invoices", field: "due_at", kind: "ordered" },
    { collection: "technicians", field: "trade", kind: "eq" },
  ],
  seedData: {
    clients: [
      { id: "client-1", name: "Acme Property Group", email: "ops@acme.example", phone: "555-0100", address: "100 Main St", created_at: "2026-01-04T09:00:00Z" },
      { id: "client-2", name: "Northwind Realty", email: "facilities@northwind.example", phone: "555-0144", address: "88 Lake Ave", created_at: "2026-02-12T09:00:00Z" },
    ],
    projects: [
      { id: "project-1", client_id: "client-1", title: "Roof replacement — Building A", status: "active", budget: 48000, start_date: "2026-03-01T08:00:00Z" },
      { id: "project-2", client_id: "client-2", title: "HVAC retrofit", status: "quoted", budget: 21000, start_date: "2026-04-15T08:00:00Z" },
    ],
    work_orders: [
      { id: "wo-1", project_id: "project-1", technician_id: "tech-1", description: "Tear off existing shingles", status: "open", scheduled_for: "2026-03-03T08:00:00Z", hours: 16 },
      { id: "wo-2", project_id: "project-1", technician_id: "tech-2", description: "Install underlayment", status: "scheduled", scheduled_for: "2026-03-05T08:00:00Z", hours: 12 },
    ],
    invoices: [
      { id: "inv-1", project_id: "project-1", amount: 24000, status: "unpaid", issued_at: "2026-03-02T00:00:00Z", due_at: "2026-03-16T00:00:00Z" },
    ],
    technicians: [
      { id: "tech-1", name: "Dana Ruiz", trade: "roofing", phone: "555-0190", active: true },
      { id: "tech-2", name: "Sam Okafor", trade: "general", phone: "555-0191", active: true },
    ],
  },
  nqlExamples: [
    'FROM projects WHERE status = "active" ORDER BY start_date DESC',
    'FROM work_orders WHERE status = "open" LIMIT 20',
    'FROM invoices WHERE status = "unpaid" ORDER BY due_at ASC',
    'FROM clients SEARCH "acme"',
    'FROM clients WHERE id = "client-1" TRAVERSE owns',
  ],
};

// ── Salon booking ────────────────────────────────────────────────────────────
const salonBooking: ScaffoldCore = {
  appName: "Salon Booking",
  description: "Appointments, stylists, services, and clients for a salon or spa.",
  collections: [
    { name: "customers", fields: [f("id", "string", true), f("name", "string", true), f("email", "string"), f("phone", "string"), f("notes", "string"), f("created_at", "datetime")] },
    { name: "stylists", fields: [f("id", "string", true), f("name", "string", true), f("specialty", "string"), f("bio", "string"), f("active", "boolean")] },
    { name: "services", fields: [f("id", "string", true), f("name", "string", true), f("duration_minutes", "number"), f("price", "number"), f("category", "string")] },
    { name: "appointments", fields: [f("id", "string", true), f("customer_id", "reference", true, "-> customers"), f("stylist_id", "reference", true, "-> stylists"), f("service_id", "reference", true, "-> services"), f("starts_at", "datetime", true), f("status", "string"), f("notes", "string")] },
    { name: "products", fields: [f("id", "string", true), f("name", "string", true), f("brand", "string"), f("price", "number"), f("in_stock", "number")] },
  ],
  relations: [
    { from: "customers", relation: "books", to: "appointments", cardinality: "one_to_many" },
    { from: "stylists", relation: "performs", to: "appointments", cardinality: "one_to_many" },
    { from: "services", relation: "scheduled_in", to: "appointments", cardinality: "one_to_many" },
  ],
  indexes: [
    { collection: "customers", field: "email", kind: "eq" },
    { collection: "customers", field: "name", kind: "search" },
    { collection: "appointments", field: "status", kind: "eq" },
    { collection: "appointments", field: "stylist_id", kind: "eq" },
    { collection: "appointments", field: "customer_id", kind: "eq" },
    { collection: "appointments", field: "starts_at", kind: "ordered" },
    { collection: "services", field: "category", kind: "eq" },
    { collection: "services", field: "price", kind: "ordered" },
    { collection: "services", field: "name", kind: "search" },
  ],
  seedData: {
    customers: [
      { id: "customer-1", name: "Jordan Lee", email: "jordan@example.com", phone: "555-0111", notes: "Prefers afternoon", created_at: "2026-01-10T15:00:00Z" },
      { id: "customer-2", name: "Priya Nair", email: "priya@example.com", phone: "555-0112", notes: "", created_at: "2026-02-02T15:00:00Z" },
    ],
    stylists: [
      { id: "stylist-1", name: "Mickey Alvarez", specialty: "color", bio: "Aveda-trained colorist", active: true },
      { id: "stylist-2", name: "Robin Cho", specialty: "cuts", bio: "Precision cutting", active: true },
    ],
    services: [
      { id: "service-1", name: "Full color", duration_minutes: 120, price: 145, category: "color" },
      { id: "service-2", name: "Women's cut", duration_minutes: 60, price: 75, category: "cuts" },
    ],
    appointments: [
      { id: "appt-1", customer_id: "customer-1", stylist_id: "stylist-1", service_id: "service-1", starts_at: "2026-06-20T18:00:00Z", status: "booked", notes: "" },
      { id: "appt-2", customer_id: "customer-2", stylist_id: "stylist-2", service_id: "service-2", starts_at: "2026-06-21T16:30:00Z", status: "booked", notes: "" },
    ],
    products: [
      { id: "product-1", name: "Shampure", brand: "Aveda", price: 32, in_stock: 24 },
    ],
  },
  nqlExamples: [
    'FROM appointments WHERE status = "booked" ORDER BY starts_at ASC LIMIT 20',
    'FROM appointments WHERE stylist_id = "stylist-1" ORDER BY starts_at ASC',
    'FROM services WHERE category = "color" ORDER BY price DESC',
    'FROM customers SEARCH "jordan"',
    'FROM customers WHERE id = "customer-1" TRAVERSE books',
  ],
};

// ── AI agent memory store ────────────────────────────────────────────────────
const agentMemory: ScaffoldCore = {
  appName: "AI Agent Memory Store",
  description:
    "Durable, time-travelable memory for AI agents: memories, conversations, messages, and tools.",
  collections: [
    { name: "agents", fields: [f("id", "string", true), f("name", "string", true), f("role", "string"), f("model", "string"), f("created_at", "datetime")] },
    { name: "memories", fields: [f("id", "string", true), f("agent_id", "reference", true, "-> agents"), f("kind", "string", false, "fact | preference | event"), f("content", "string", true), f("importance", "number"), f("embedding", "json"), f("created_at", "datetime")] },
    { name: "conversations", fields: [f("id", "string", true), f("agent_id", "reference", true, "-> agents"), f("title", "string"), f("status", "string"), f("started_at", "datetime")] },
    { name: "messages", fields: [f("id", "string", true), f("conversation_id", "reference", true, "-> conversations"), f("role", "string", true), f("content", "string", true), f("seq", "number"), f("created_at", "datetime")] },
    { name: "tools", fields: [f("id", "string", true), f("name", "string", true), f("description", "string"), f("schema", "json")] },
  ],
  relations: [
    { from: "agents", relation: "remembers", to: "memories", cardinality: "one_to_many" },
    { from: "agents", relation: "has_conversation", to: "conversations", cardinality: "one_to_many" },
    { from: "conversations", relation: "contains", to: "messages", cardinality: "one_to_many" },
    { from: "agents", relation: "uses", to: "tools", cardinality: "many_to_many" },
  ],
  indexes: [
    { collection: "memories", field: "agent_id", kind: "eq" },
    { collection: "memories", field: "kind", kind: "eq" },
    { collection: "memories", field: "importance", kind: "ordered" },
    { collection: "memories", field: "content", kind: "search" },
    { collection: "conversations", field: "agent_id", kind: "eq" },
    { collection: "conversations", field: "status", kind: "eq" },
    { collection: "messages", field: "conversation_id", kind: "eq" },
    { collection: "messages", field: "seq", kind: "ordered" },
    { collection: "messages", field: "content", kind: "search" },
  ],
  seedData: {
    agents: [
      { id: "agent-1", name: "Malachi", role: "support", model: "claude-sonnet-4-6", created_at: "2026-05-01T00:00:00Z" },
    ],
    memories: [
      { id: "mem-1", agent_id: "agent-1", kind: "preference", content: "User prefers terse answers.", importance: 8, embedding: [], created_at: "2026-05-02T00:00:00Z" },
      { id: "mem-2", agent_id: "agent-1", kind: "fact", content: "User ships to PyPI and npm.", importance: 6, embedding: [], created_at: "2026-05-03T00:00:00Z" },
    ],
    conversations: [
      { id: "conv-1", agent_id: "agent-1", title: "Release pipeline", status: "active", started_at: "2026-06-01T00:00:00Z" },
    ],
    messages: [
      { id: "msg-1", conversation_id: "conv-1", role: "user", content: "Ship it to both registries.", seq: 1, created_at: "2026-06-01T00:01:00Z" },
      { id: "msg-2", conversation_id: "conv-1", role: "assistant", content: "On it — building the matrix.", seq: 2, created_at: "2026-06-01T00:01:05Z" },
    ],
    tools: [
      { id: "tool-1", name: "web_search", description: "Search the web", schema: { query: "string" } },
    ],
  },
  nqlExamples: [
    'FROM memories WHERE agent_id = "agent-1" ORDER BY importance DESC LIMIT 10',
    'FROM memories SEARCH "preference"',
    'FROM messages WHERE conversation_id = "conv-1" ORDER BY seq ASC',
    'FROM conversations WHERE status = "active" ORDER BY started_at DESC',
    'FROM memories AS OF 100 WHERE agent_id = "agent-1"',
  ],
};

// ── Marketplace backend ──────────────────────────────────────────────────────
const marketplace: ScaffoldCore = {
  appName: "Marketplace Backend",
  description: "Two-sided marketplace: users, listings, orders, reviews, and categories.",
  collections: [
    { name: "users", fields: [f("id", "string", true), f("name", "string", true), f("email", "string"), f("role", "string", false, "buyer | seller | both"), f("rating", "number"), f("created_at", "datetime")] },
    { name: "listings", fields: [f("id", "string", true), f("seller_id", "reference", true, "-> users"), f("title", "string", true), f("description", "string"), f("price", "number", true), f("category_id", "reference", false, "-> categories"), f("status", "string"), f("created_at", "datetime")] },
    { name: "orders", fields: [f("id", "string", true), f("buyer_id", "reference", true, "-> users"), f("listing_id", "reference", true, "-> listings"), f("quantity", "number"), f("total", "number"), f("status", "string"), f("placed_at", "datetime")] },
    { name: "reviews", fields: [f("id", "string", true), f("order_id", "reference", true, "-> orders"), f("author_id", "reference", true, "-> users"), f("rating", "number", true), f("body", "string"), f("created_at", "datetime")] },
    { name: "categories", fields: [f("id", "string", true), f("name", "string", true), f("slug", "string")] },
  ],
  relations: [
    { from: "users", relation: "sells", to: "listings", cardinality: "one_to_many" },
    { from: "users", relation: "places", to: "orders", cardinality: "one_to_many" },
    { from: "listings", relation: "ordered_in", to: "orders", cardinality: "one_to_many" },
    { from: "orders", relation: "has_review", to: "reviews", cardinality: "one_to_one" },
    { from: "categories", relation: "groups", to: "listings", cardinality: "one_to_many" },
  ],
  indexes: [
    { collection: "users", field: "email", kind: "eq" },
    { collection: "listings", field: "status", kind: "eq" },
    { collection: "listings", field: "seller_id", kind: "eq" },
    { collection: "listings", field: "category_id", kind: "eq" },
    { collection: "listings", field: "price", kind: "ordered" },
    { collection: "listings", field: "title", kind: "search" },
    { collection: "listings", field: "description", kind: "search" },
    { collection: "orders", field: "status", kind: "eq" },
    { collection: "orders", field: "buyer_id", kind: "eq" },
    { collection: "orders", field: "placed_at", kind: "ordered" },
    { collection: "reviews", field: "order_id", kind: "eq" },
  ],
  seedData: {
    users: [
      { id: "user-1", name: "Casey Vendor", email: "casey@example.com", role: "seller", rating: 4.8, created_at: "2026-01-01T00:00:00Z" },
      { id: "user-2", name: "Avery Buyer", email: "avery@example.com", role: "buyer", rating: 5.0, created_at: "2026-01-05T00:00:00Z" },
    ],
    listings: [
      { id: "listing-1", seller_id: "user-1", title: "Vintage camera", description: "1970s rangefinder, fully serviced", price: 240, category_id: "cat-1", status: "active", created_at: "2026-02-01T00:00:00Z" },
      { id: "listing-2", seller_id: "user-1", title: "Studio tripod", description: "Carbon fiber, ball head", price: 95, category_id: "cat-1", status: "active", created_at: "2026-02-03T00:00:00Z" },
    ],
    orders: [
      { id: "order-1", buyer_id: "user-2", listing_id: "listing-1", quantity: 1, total: 240, status: "paid", placed_at: "2026-02-10T00:00:00Z" },
    ],
    reviews: [
      { id: "review-1", order_id: "order-1", author_id: "user-2", rating: 5, body: "Exactly as described.", created_at: "2026-02-14T00:00:00Z" },
    ],
    categories: [
      { id: "cat-1", name: "Cameras", slug: "cameras" },
    ],
  },
  nqlExamples: [
    'FROM listings WHERE status = "active" ORDER BY price ASC LIMIT 25',
    'FROM listings SEARCH "vintage camera"',
    'FROM orders WHERE buyer_id = "user-2" ORDER BY placed_at DESC',
    'FROM listings WHERE category_id = "cat-1" AND status = "active"',
    'FROM users WHERE id = "user-1" TRAVERSE sells',
  ],
};

// ── Generic fallback ─────────────────────────────────────────────────────────
function generic(prompt: string): ScaffoldCore {
  return {
    appName: "App Data Model",
    description: prompt.trim() ? `Schema scaffolded from: ${prompt.trim().slice(0, 140)}` : "A general-purpose data model.",
    collections: [
      { name: "items", fields: [f("id", "string", true), f("name", "string", true), f("description", "string"), f("status", "string"), f("value", "number"), f("created_at", "datetime")] },
      { name: "categories", fields: [f("id", "string", true), f("name", "string", true), f("slug", "string")] },
      { name: "events", fields: [f("id", "string", true), f("item_id", "reference", true, "-> items"), f("type", "string", true), f("payload", "json"), f("at", "datetime", true)] },
    ],
    relations: [
      { from: "categories", relation: "groups", to: "items", cardinality: "one_to_many" },
      { from: "items", relation: "emits", to: "events", cardinality: "one_to_many" },
    ],
    indexes: [
      { collection: "items", field: "status", kind: "eq" },
      { collection: "items", field: "name", kind: "search" },
      { collection: "items", field: "created_at", kind: "ordered" },
      { collection: "events", field: "item_id", kind: "eq" },
      { collection: "events", field: "type", kind: "eq" },
      { collection: "categories", field: "slug", kind: "eq" },
    ],
    seedData: {
      items: [
        { id: "item-1", name: "First item", description: "Seed row", status: "active", value: 10, created_at: "2026-06-01T00:00:00Z" },
        { id: "item-2", name: "Second item", description: "Seed row", status: "archived", value: 4, created_at: "2026-06-02T00:00:00Z" },
      ],
      categories: [{ id: "cat-1", name: "General", slug: "general" }],
      events: [{ id: "event-1", item_id: "item-1", type: "created", payload: {}, at: "2026-06-01T00:00:00Z" }],
    },
    nqlExamples: [
      'FROM items WHERE status = "active" ORDER BY created_at DESC LIMIT 20',
      'FROM items SEARCH "keyword"',
      'FROM events WHERE item_id = "item-1" ORDER BY at ASC',
      "FROM items AS OF 0",
    ],
  };
}

interface TemplateDef {
  key: string;
  label: string;
  keywords: string[];
  core: ScaffoldCore;
}

const TEMPLATES: TemplateDef[] = [
  { key: "contractor", label: "Contractor CRM", keywords: ["contractor", "crm", "construction", "work order", "technician", "trade", "field service", "client project"], core: contractorCrm },
  { key: "salon", label: "Salon booking app", keywords: ["salon", "booking", "appointment", "stylist", "spa", "barber", "hair", "beauty", "aveda"], core: salonBooking },
  { key: "agent", label: "AI agent memory store", keywords: ["agent", "memory", "llm", "assistant", "chatbot", "rag", "vector", "embedding", "conversation"], core: agentMemory },
  { key: "marketplace", label: "Marketplace backend", keywords: ["marketplace", "ecommerce", "e-commerce", "shop", "store", "listing", "seller", "buyer", "order"], core: marketplace },
];

export const EXAMPLE_PROMPTS: string[] = [
  "Contractor CRM",
  "Salon booking app",
  "AI agent memory store",
  "Marketplace backend",
];

/** Pick the best template for a prompt and return a complete, valid scaffold. */
export function matchTemplate(prompt: string): NEDBScaffold {
  const p = (prompt || "").toLowerCase();
  let best: TemplateDef | null = null;
  let bestScore = 0;
  for (const t of TEMPLATES) {
    const score = t.keywords.reduce((n, kw) => (p.includes(kw) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  const core = best ? best.core : generic(prompt);
  return finalizeScaffold(core);
}

/** Provider/model list used when no AiAssist credentials are configured. */
export const MOCK_PROVIDERS = {
  defaultProvider: "anthropic",
  providers: [
    { id: "anthropic", label: "Anthropic", isDefault: true, models: [
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
    ] },
    { id: "openai", label: "OpenAI", isDefault: false, models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-5.5", name: "GPT-5.5" },
    ] },
    { id: "groq", label: "Groq", isDefault: false, models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
    ] },
    { id: "gemini", label: "Google Gemini", isDefault: false, models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    ] },
  ],
};
