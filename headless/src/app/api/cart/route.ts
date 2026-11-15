import { cookies } from "next/headers";
import { fetchCart } from "@/lib/shopify";

export async function GET() {
  const id = (await cookies()).get("cart")?.value;
  const cart = id?.startsWith("gid://shopify/Cart/") && id.length < 200 ? await fetchCart(id).catch(() => null) : null;
  return Response.json({ count: cart?.totalQuantity ?? 0 }, { headers: { "cache-control": "private, no-store" } });
}
