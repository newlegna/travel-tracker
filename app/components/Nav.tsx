import Link from "next/link";

const links = [
  { href: "/", label: "Years" },
  { href: "/all-time", label: "All time" },
  { href: "/photos", label: "Photos" },
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/90 bg-sand/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="group min-w-0 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">Travel Tracker</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-ink transition group-hover:text-moss sm:text-2xl">
            Year-by-Year
          </h1>
        </Link>
        <nav
          aria-label="Main"
          className="flex flex-wrap items-center gap-1 rounded-full border border-stone-200/90 bg-white/85 p-1 shadow-card"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
