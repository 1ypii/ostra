import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { fetchCart } from "@/lib/shopify";
import { formatMoney } from "@/lib/format";
import { updateLine } from "@/app/actions";
import { CartSync } from "@/components/cart-sync";

export const metadata: Metadata = { title: "cart", robots: { index: false } };

async function Lines() {
  const id = (await cookies()).get("cart")?.value;
  const cart = id?.startsWith("gid://shopify/Cart/") ? await fetchCart(id).catch(() => null) : null;

  if (!cart || cart.lines.nodes.length === 0) {
    return (
      <div className="py-16">
        <CartSync count={0} />
        <p className="text-mute">your cart is empty</p>
        <Link href="/" className="mt-6 inline-block bg-ink px-6 py-3 text-sm text-cream transition-opacity hover:opacity-85">
          keep shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_20rem]">
      <CartSync count={cart.totalQuantity} />
      <ul className="border-t border-line">
        {cart.lines.nodes.map((line) => {
          const m = line.merchandise;
          return (
            <li key={line.id} className="grid grid-cols-[5rem_1fr_auto] gap-4 border-b border-line py-5">
              <div className="relative aspect-square bg-sand">
                {m.image && <Image src={m.image.url} alt={m.image.altText ?? m.product.title} fill loading="eager" sizes="80px" className="object-cover" />}
              </div>
              <div>
                <Link href={`/products/${m.product.handle}`} className="text-sm hover:underline">{m.product.title}</Link>
                {m.title !== "Default Title" && <p className="mt-1 text-xs text-mute">{m.title}</p>}
                <div className="mt-3 flex items-center gap-1">
                  <form action={updateLine}>
                    <input type="hidden" name="line" value={line.id} />
                    <input type="hidden" name="quantity" value={line.quantity - 1} />
                    <button aria-label="less" className="h-8 w-8 border border-line hover:border-ink">−</button>
                  </form>
                  <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                  <form action={updateLine}>
                    <input type="hidden" name="line" value={line.id} />
                    <input type="hidden" name="quantity" value={Math.min(10, line.quantity + 1)} />
                    <button aria-label="more" className="h-8 w-8 border border-line hover:border-ink">+</button>
                  </form>
                  <form action={updateLine} className="ml-3">
                    <input type="hidden" name="line" value={line.id} />
                    <input type="hidden" name="quantity" value={0} />
                    <button className="text-xs text-mute underline-offset-4 hover:underline">remove</button>
                  </form>
                </div>
              </div>
              <p className="text-sm tabular-nums">{formatMoney(line.cost.totalAmount)}</p>
            </li>
          );
        })}
      </ul>
      <aside className="self-start bg-sand p-6">
        <div className="flex justify-between text-sm">
          <span>subtotal</span>
          <span className="tabular-nums">{formatMoney(cart.cost.subtotalAmount)}</span>
        </div>
        <p className="mt-2 text-xs text-mute">shipping and taxes are worked out at checkout</p>
        <a href={cart.checkoutUrl} className="mt-6 block bg-ink py-3 text-center text-sm text-cream transition-opacity hover:opacity-85">
          checkout
        </a>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="mb-10 font-serif text-5xl">cart</h1>
      <Suspense fallback={<div className="h-64" />}>
        <Lines />
      </Suspense>
    </div>
  );
}
