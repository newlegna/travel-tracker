type Stat = {
  label: string;
  value: string | number;
  detail?: string;
};

export function YearStats({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-stone-200/80 bg-stone-50/50 px-4 py-3.5 shadow-card"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{stat.label}</dt>
          <dd className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-ink sm:text-[1.65rem]">{stat.value}</dd>
          {stat.detail ? <dd className="mt-1 text-sm leading-snug text-stone-600">{stat.detail}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
