import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Instrument_Serif, Inter } from "next/font/google";
import { getCollections } from "@/lib/shopify";
import { CartLink } from "@/components/cart-link";
import "./globals.css";

const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400" });
const sans = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ostra", template: "%s | ostra" },
  description: "small batch stoneware, wheel thrown and fired twice",
};

async function Nav({ mobile }: { mobile?: boolean }) {
  const collections = await getCollections();
  return (
    <nav className={mobile ? "flex gap-5 overflow-x-auto border-b border-line px-4 py-3 text-sm whitespace-nowrap md:hidden" : "hidden gap-6 text-sm md:flex"}>
      {collections.map((c) => (
        <Link key={c.handle} href={`/collections/${c.handle}`} className="text-mute transition-colors hover:text-ink">
          {c.title.toLowerCase()}
        </Link>
      ))}
    </nav>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <div className="bg-ink py-2 text-center text-xs tracking-wide text-cream">
          a headless next.js build of the ostra store
        </div>
        <header className="border-b border-line">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 md:px-6">
            <Link href="/" className="font-serif text-3xl leading-none">ostra</Link>
            <Suspense>
              <Nav />
            </Suspense>
            <CartLink />
          </div>
          <Suspense>
            <Nav mobile />
          </Suspense>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-mute md:flex-row md:justify-between md:px-6">
            <span>ostra stoneware</span>
            <a href="https://github.com/1ypii/ostra" className="transition-colors hover:text-ink">source on github</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
