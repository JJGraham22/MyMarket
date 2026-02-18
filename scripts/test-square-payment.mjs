#!/usr/bin/env node
/**
 * Test Square payment flow:
 * 1. Find a PENDING_PAYMENT order whose seller uses Square
 * 2. Call create-checkout-session API to get Square payment link
 * 3. Print the URL so you can complete payment with a test card
 *
 * Usage:
 *   node scripts/test-square-payment.mjs [orderId]
 *   node scripts/test-square-payment.mjs
 *
 * If orderId is omitted, the script finds one. Requires:
 * - .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * - Dev server running at NEXT_PUBLIC_SITE_URL (default http://localhost:3000)
 *
 * Load .env.local (Node 18+)
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const path = new URL("../.env.local", import.meta.url);
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        value = value.slice(1, -1);
      process.env[key] = value;
    }
  } catch (e) {
    console.error("Could not load .env.local:", e.message);
    process.exit(1);
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findSquareOrder(orderId) {
  if (orderId) {
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, seller_session_id, seller_sessions(seller_id)")
      .eq("id", orderId)
      .single();
    if (error || !order) return null;
    if (order.status !== "PENDING_PAYMENT") {
      console.error(`Order ${orderId} status is ${order.status}, expected PENDING_PAYMENT`);
      return null;
    }
    const sellerId = order.seller_sessions?.seller_id;
    if (!sellerId) return null;
    const { data: profile } = await supabase.from("profiles").select("payment_provider").eq("id", sellerId).single();
    if (profile?.payment_provider !== "square") {
      console.error("Order's seller is not using Square. Use an order from a seller who has Square connected.");
      return null;
    }
    return order.id;
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, seller_session_id, expires_at, seller_sessions(seller_id)")
    .eq("status", "PENDING_PAYMENT")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!orders?.length) {
    console.error("No PENDING_PAYMENT orders found. Create an order first (e.g. at /seller/checkout).");
    return null;
  }

  const now = new Date().toISOString();
  let hadExpired = false;
  for (const o of orders) {
    if (o.expires_at && o.expires_at < now) {
      hadExpired = true;
      continue;
    }
    const sellerId = o.seller_sessions?.seller_id;
    if (!sellerId) continue;
    const { data: profile } = await supabase.from("profiles").select("payment_provider").eq("id", sellerId).single();
    if (profile?.payment_provider === "square") return o.id;
  }

  if (hadExpired) {
    console.error("All PENDING_PAYMENT orders are expired. Create a new order at " + SITE_URL + "/seller/checkout (as the seller with Square), then run this script again.");
  } else {
    console.error("No PENDING_PAYMENT order found for a seller with Square. Connect Square in Settings > Payments, then create an order at " + SITE_URL + "/seller/checkout.");
  }
  return null;
}

async function main() {
  const orderIdArg = process.argv[2];
  const orderId = await findSquareOrder(orderIdArg);
  if (!orderId) process.exit(1);

  console.log("Order ID:", orderId);
  console.log("Requesting Square checkout URL...\n");

  const res = await fetch(`${SITE_URL}/api/payments/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error("Create checkout session failed:", res.status, body);
    process.exit(1);
  }

  if (!body.url) {
    console.error("Response missing url:", body);
    process.exit(1);
  }

  console.log("✅ Square payment link created.\n");
  console.log("Open this URL in your browser to complete the test payment:");
  console.log(body.url);
  console.log("\nSquare Sandbox test card: 4111 1111 1111 1111");
  console.log("Use any future expiry, any CVC, any postal code.");
  console.log("\nAfter paying, the webhook should mark the order PAID. Check:");
  console.log(`  - Order status in DB or at ${SITE_URL}/orders`);
  console.log("  - Server logs for webhook processing.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
