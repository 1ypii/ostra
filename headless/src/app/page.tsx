import Image from "next/image";
import Link from "next/link";
import { getCollections, getFeatured } from "@/lib/shopify";
import { ProductGrid } from "@/components/product-grid";

export default async function Home() {
  const [featured, collections] = await Promise.all([getFeatured(), getCollections()]);
  const hero = (featured[1] ?? featured[0])?.featuredImage;

  return (
    <>
      <section className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center px-4 py-14 md:px-6 md:py-24">
          <p className="text-xs tracking-[0.2em] text-mute">small batch stoneware</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] md:text-7xl">made slowly, used every day</h1>
          <p className="mt-6 max-w-sm text-mute">
            wheel thrown mugs, plates and bowls glazed in quiet colours and fired twice for a surface that ages well
          </p>
          {collections[0] && (
            <Link
              href={`/collections/${collections[0].handle}`}
              className="mt-8 self-start bg-ink px-6 py-3 text-sm text-cream transition-opacity hover:opacity-85"
            >
              shop the range
            </Link>
          )}
        </div>
        {hero && (
          <div className="relative aspect-[4/5] bg-sand md:aspect-auto">
            <Image src={hero.url} alt={hero.altText ?? ""} fill preload sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="mb-8 font-serif text-4xl">bestsellers</h2>
        <ProductGrid products={featured} />
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.handle}
              href={`/collections/${c.handle}`}
              className="group flex items-center justify-between border-b border-line px-4 py-8 md:border-b-0 md:border-r md:px-6 md:last:border-r-0"
            >
              <span className="font-serif text-3xl">{c.title.toLowerCase()}</span>
              <span className="text-mute transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
