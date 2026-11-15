import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProduct, getProductHandles } from "@/lib/shopify";
import { parseBadges } from "@/lib/format";
import { Gallery } from "@/components/gallery";
import { Buy } from "@/components/buy";

export async function generateStaticParams() {
  const handles = await getProductHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  if (!product) return {};
  const image = product.images.nodes[0];
  return {
    title: product.seo.title ?? product.title,
    description: product.seo.description ?? product.description.slice(0, 160),
    openGraph: image ? { images: [{ url: image.url, width: image.width, height: image.height }] } : undefined,
  };
}

async function Details({ params }: Pick<PageProps<"/products/[handle]">, "params">) {
  const product = await getProduct((await params).handle);
  if (!product) notFound();

  const badges = parseBadges(product.badges);
  const collection = product.collections.nodes[0];
  const specs = [
    ["material", product.material?.value],
    ["glaze", product.glaze?.value],
    ["dimensions", product.dimensions?.value],
    ["care", product.care?.value],
  ].filter((s): s is [string, string] => Boolean(s[1]));

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.nodes.map((i) => i.url),
    brand: { "@type": "Brand", name: "ostra" },
    material: product.material?.value,
    offers: product.variants.nodes.map((v) => ({
      "@type": "Offer",
      price: v.price.amount,
      priceCurrency: v.price.currencyCode,
      availability: v.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
      <Gallery images={product.images.nodes} title={product.title} />
      <div className="md:sticky md:top-8 md:self-start">
        <nav aria-label="breadcrumb" className="text-xs text-mute">
          <Link href="/" className="hover:text-ink">home</Link>
          {collection && (
            <>
              {" / "}
              <Link href={`/collections/${collection.handle}`} className="hover:text-ink">{collection.title.toLowerCase()}</Link>
            </>
          )}
        </nav>

        {badges.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {badges.map((b) => (
              <li key={b} className="border border-ink px-2 py-1 text-[11px] tracking-wide">{b}</li>
            ))}
          </ul>
        )}

        <h1 className="mt-4 font-serif text-5xl leading-tight">{product.title}</h1>

        {product.variants.nodes.length > 0 && <Buy options={product.options} variants={product.variants.nodes} />}

        <div className="prose-ostra mt-8 text-mute" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />

        {specs.length > 0 && (
          <dl className="mt-8 border-t border-line">
            {specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-3 text-sm">
                <dt className="text-mute">{k}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/products/[handle]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Suspense fallback={<div className="aspect-[4/5] max-w-xl bg-sand" />}>
        <Details params={params} />
      </Suspense>
    </div>
  );
}
