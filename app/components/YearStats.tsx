type Stat = {
  label: string;
  value: string | number;
  detail?: string;
};

export function YearStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-stone-500">{stat.label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{stat.value}</p>
          {stat.detail ? <p className="mt-1 text-sm text-stone-600">{stat.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}
