"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, EmptyState, Badge, Skeleton } from "@/app/components/ui";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING_PAYMENT", label: "Pending payment" },
  { value: "PAID", label: "Paid" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  seller_session_id: string;
  seller_sessions?: {
    market_days?: {
      markets?: { name: string } | null;
      date?: string;
    } | null;
  } | null;
}

interface OrdersClientProps {
  orders: OrderRow[];
  role: "buyer" | "seller";
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "PAID" || status === "COMPLETED" ? "success" : status === "EXPIRED" || status === "CANCELLED" ? "error" : "neutral";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

function formatOrderDate(created_at: string) {
  return new Date(created_at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function marketLabel(order: OrderRow): string {
  const md = order.seller_sessions?.market_days;
  const name = md?.markets?.name;
  const date = md?.date ? new Date(md.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  if (name && date) return `${name} · ${date}`;
  if (name) return name;
  return "Market";
}

export function OrdersClient({ orders: initialOrders, role }: OrdersClientProps) {
  const [statusFilter, setStatusFilter] = useState("");

  const orders = statusFilter
    ? initialOrders.filter((o) => o.status === statusFilter)
    : initialOrders;

  return (
    <div className="space-y-8">
      <PageHeader
        title={role === "buyer" ? "My orders" : "Orders"}
        subtitle={
          role === "buyer"
            ? "View your order history and status."
            : "Orders for your seller sessions. Filter by status."
        }
      />

      {role === "seller" && (
        <Card padding="md">
          <label htmlFor="status-filter" className="mb-2 block text-sm font-medium text-[var(--cream-muted)]">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full max-w-xs"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Card>
      )}

      {orders.length === 0 ? (
        <EmptyState
          message={
            role === "buyer"
              ? "You haven't placed any orders yet."
              : statusFilter
                ? "No orders match this status."
                : "No orders for your sessions yet."
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <ul className="divide-y divide-[rgba(168,137,104,0.2)]">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={"/orders/" + order.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-[var(--brown-bg)]/40 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[var(--cream-muted)]">{order.id.slice(0, 8)}…</p>
                    {role === "seller" && (
                      <p className="mt-0.5 text-sm text-[var(--cream-muted)]">{marketLabel(order)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-medium text-[var(--cream)]">
                      ${(order.total_cents / 100).toFixed(2)}
                    </span>
                    <span className="text-xs text-[var(--cream-muted)]">{formatOrderDate(order.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
