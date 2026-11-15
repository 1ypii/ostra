"use server";

import { cookies, headers } from "next/headers";
import { refresh } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cartCreate, cartLinesAdd, cartLinesRemove, cartLinesUpdate } from "@/lib/shopify";

const variantPattern = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const linePattern = /^gid:\/\/shopify\/CartLine\/[\w-]+(\?cart=[\w-]+)?$/;

type Result = { error: string | null };

async function limit() {
  const ip = (await headers()).get("cf-connecting-ip") ?? undefined;
  const { env } = await getCloudflareContext({ async: true });
  const { success } = await env.cartlimit.limit({ key: ip ?? "unknown" });
  return { ip, ok: success };
}

async function cartCookie() {
  const id = (await cookies()).get("cart")?.value;
  return id && id.startsWith("gid://shopify/Cart/") && id.length < 200 ? id : null;
}

export async function addToCart(_prev: Result, form: FormData): Promise<Result> {
  const merchandiseId = String(form.get("variant") ?? "");
  const quantity = Number(form.get("quantity") ?? 1);
  if (!variantPattern.test(merchandiseId)) return { error: "pick an option" };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return { error: "quantity must be 1 to 10" };

  const { ip, ok } = await limit();
  if (!ok) return { error: "too many requests, try again in a minute" };

  const lines = [{ merchandiseId, quantity }];
  const cartId = await cartCookie();
  let result = cartId ? await cartLinesAdd(cartId, lines, ip) : null;

  if (!result?.cart) {
    result = await cartCreate(lines, ip);
    if (result.cart) {
      (await cookies()).set("cart", result.cart.id, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
    }
  }

  if (!result.cart) return { error: result.userErrors[0]?.message ?? "could not add to cart" };
  refresh();
  return { error: null };
}

export async function updateLine(form: FormData) {
  const lineId = String(form.get("line") ?? "");
  const quantity = Number(form.get("quantity"));
  if (!linePattern.test(lineId) || !Number.isInteger(quantity) || quantity < 0 || quantity > 10) return;

  const cartId = await cartCookie();
  if (!cartId) return;

  const { ip, ok } = await limit();
  if (!ok) return;

  if (quantity === 0) await cartLinesRemove(cartId, [lineId], ip);
  else await cartLinesUpdate(cartId, [{ id: lineId, quantity }], ip);
  refresh();
}
