import Image from "next/image";
import Link from "next/link";
import { formatMoney, parseBadges } from "@/lib/format";
import type { ProductCard } from "@/lib/shopify";

export function ProductGrid({ products }: { products: ProductCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
      {products.map((p, i) => {
        const badge = parseBadges(p.badges)[0];
        return (
          <li key={p.id}>
            <Link href={`/products/${p.handle}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                {p.featuredImage && (
                  <Image
                    src={p.featuredImage.url}
                    alt={p.featuredImage.altText ?? p.title}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    loading={i < 4 ? "eager" : "lazy"}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                )}
                {badge && (
                  <span className="absolute left-3 top-3 bg-cream px-2 py-1 text-[11px] tracking-wide">{badge}</span>
                )}
              </div>
              <h3 className="mt-3 text-sm">{p.title}</h3>
              <p className="mt-1 text-sm text-mute">{formatMoney(p.priceRange.minVariantPrice)}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
