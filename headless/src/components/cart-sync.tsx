"use client";

import { useEffect } from "react";

export function CartSync({ count }: { count: number }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("cart", { detail: count }));
  }, [count]);
  return null;
}
