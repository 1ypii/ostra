"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { addToCart } from "@/app/actions";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/shopify";

export function Buy({ options, variants }: { options: Product["options"]; variants: Product["variants"]["nodes"] }) {
  const first = variants.find((v) => v.availableForSale) ?? variants[0];
  const [picked, setPicked] = useState(() => Object.fromEntries(first.selectedOptions.map((o) => [o.name, o.value])));
  const [qty, setQty] = useState(1);
  const [state, action, pending] = useActionState(addToCart, { error: null });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (sent && !pending && !state.error) window.dispatchEvent(new Event("cart"));
  }, [sent, pending, state]);

  const variant = variants.find((v) => v.selectedOptions.every((o) => picked[o.name] === o.value));
  const choices = options.filter((o) => o.optionValues.length > 1);

  return (
    <form action={action} onSubmit={() => setSent(true)} className="mt-8 flex flex-col gap-6">
      <p className="text-xl">{variant ? formatMoney(variant.price) : "unavailable"}</p>

      {choices.map((o) => (
        <fieldset key={o.name}>
          <legend className="mb-2 text-xs tracking-wide text-mute">{o.name.toLowerCase()}</legend>
          <div className="flex flex-wrap gap-2">
            {o.optionValues.map((v) => {
              const on = picked[o.name] === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked((p) => ({ ...p, [o.name]: v.name }))}
                  className={`border px-4 py-2 text-sm transition-colors ${on ? "border-ink bg-ink text-cream" : "border-line hover:border-ink"}`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <input type="hidden" name="variant" value={variant?.id ?? ""} />

      <div className="flex gap-3">
        <div className="flex items-center border border-line">
          <button type="button" aria-label="less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-10 hover:bg-sand">
            −
          </button>
          <input
            name="quantity"
            value={qty}
            readOnly
            aria-label="quantity"
            className="w-8 bg-transparent text-center tabular-nums outline-none"
          />
          <button type="button" aria-label="more" onClick={() => setQty((q) => Math.min(10, q + 1))} className="h-12 w-10 hover:bg-sand">
            +
          </button>
        </div>
        <button
          type="submit"
          disabled={!variant?.availableForSale || pending}
          className="h-12 flex-1 bg-ink text-sm text-cream transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {!variant?.availableForSale ? "sold out" : pending ? "adding" : "add to cart"}
        </button>
      </div>

      <p aria-live="polite" className="min-h-5 text-sm">
        {state.error ? (
          <span className="text-clay">{state.error}</span>
        ) : sent && !pending ? (
          <>
            added, <Link href="/cart" className="underline underline-offset-4">view cart</Link>
          </>
        ) : null}
      </p>
    </form>
  );
}
