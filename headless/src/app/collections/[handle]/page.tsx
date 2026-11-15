import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCollection, getCollections } from "@/lib/shopify";
import { ProductGrid } from "@/components/product-grid";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const collection = await getCollection((await params).handle);
  if (!collection) return {};
  return { title: collection.title.toLowerCase(), description: collection.description || undefined };
}

async function Listing({ params }: Pick<PageProps<"/collections/[handle]">, "params">) {
  const collection = await getCollection((await params).handle);
  if (!collection) notFound();

  return (
    <>
      <header className="mb-10 max-w-xl">
        <h1 className="font-serif text-5xl">{collection.title.toLowerCase()}</h1>
        {collection.description && <p className="mt-4 text-mute">{collection.description}</p>}
        <p className="mt-4 text-sm text-mute">{collection.products.nodes.length} pieces</p>
      </header>
      <ProductGrid products={collection.products.nodes} />
    </>
  );
}

export default function CollectionPage({ params }: PageProps<"/collections/[handle]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <Suspense fallback={<div className="h-96" />}>
        <Listing params={params} />
      </Suspense>
    </div>
  );
}
