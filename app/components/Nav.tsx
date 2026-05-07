import Link from "next/link";

const links = [
  { href: "/", label: "Years" },
  { href: "/all-time", label: "All time" },
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  return (
    <header className="border-b border-stone-200 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="group">
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Travel Tracker</p>
          <h1 className="text-2xl font-semibold text-ink transition group-hover:text-moss">
            Year-by-Year
          </h1>
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm font-medium text-stone-700">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-stone-300 px-4 py-2 transition hover:border-moss hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
