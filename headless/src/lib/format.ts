import type { Money } from "@/lib/shopify";

export function formatMoney(m: Money) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currencyCode }).format(Number(m.amount));
}

export function parseBadges(field: { value: string } | null) {
  if (!field) return [];
  try {
    const list = JSON.parse(field.value);
    return Array.isArray(list) ? list.filter((b): b is string => typeof b === "string").slice(0, 3) : [];
  } catch {
    return [];
  }
}
