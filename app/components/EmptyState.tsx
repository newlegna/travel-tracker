import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-stone-300/90 bg-white/80 p-8 text-center shadow-card sm:p-10">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-stone-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-8 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-moss"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
