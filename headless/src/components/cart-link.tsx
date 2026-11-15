"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function CartLink() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let live = true;
    const load = () => {
      fetch("/api/cart")
        .then((r) => r.json() as Promise<{ count: number }>)
        .then((d) => live && setCount(d.count))
        .catch(() => {});
    };
    const onCart = (e: Event) => {
      const next = (e as CustomEvent<number | undefined>).detail;
      if (typeof next === "number") setCount(next);
      else load();
    };

    load();
    window.addEventListener("cart", onCart);
    return () => {
      live = false;
      window.removeEventListener("cart", onCart);
    };
  }, [pathname]);

  return (
    <Link href="/cart" className="flex items-center gap-2 text-sm">
      cart <span className="tabular-nums">{count}</span>
    </Link>
  );
}
