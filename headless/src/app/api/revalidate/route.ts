import { revalidateTag } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const topics = new Set([
  "products/create",
  "products/update",
  "products/delete",
  "collections/create",
  "collections/update",
  "collections/delete",
]);

export async function POST(req: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const { success } = await env.hooklimit.limit({ key: ip });
  if (!success) return new Response(null, { status: 429 });

  const secret = process.env.webhooksecret;
  const sig = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic");
  if (!secret || !sig || !topic) return new Response(null, { status: 401 });
  if (Number(req.headers.get("content-length") ?? 0) > 2_000_000) return new Response(null, { status: 413 });

  let mac: Uint8Array<ArrayBuffer>;
  try {
    mac = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
  } catch {
    return new Response(null, { status: 401 });
  }

  const body = await req.arrayBuffer();
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  if (!(await crypto.subtle.verify("HMAC", key, mac, body))) return new Response(null, { status: 401 });

  if (topics.has(topic)) revalidateTag("catalog", { expire: 0 });
  return new Response(null, { status: 200 });
}
