"use client";

import Image from "next/image";
import { useState } from "react";
import type { Img } from "@/lib/shopify";

export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [index, setIndex] = useState(0);
  const main = images[index];
  if (!main) return <div className="aspect-[4/5] bg-sand" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Image key={main.url} src={main.url} alt={main.altText ?? title} fill preload sizes="(min-width: 768px) 55vw, 100vw" className="animate-[fade_.4s_ease-out] object-cover" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              aria-label={`show image ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`relative aspect-square overflow-hidden bg-sand transition-opacity ${i === index ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
            >
              <Image src={img.url} alt="" fill sizes="10vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
