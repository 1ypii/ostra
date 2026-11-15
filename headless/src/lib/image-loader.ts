"use client";

export default function shopifyLoader({ src, width }: { src: string; width: number }) {
  const url = new URL(src);
  url.searchParams.set("width", String(width));
  return url.toString();
}
