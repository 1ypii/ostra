import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 md:px-6">
      <h1 className="font-serif text-5xl">nothing here</h1>
      <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">back home</Link>
    </div>
  );
}
