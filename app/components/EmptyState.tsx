import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-10 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-stone-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
