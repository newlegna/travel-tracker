import Link from "next/link";
import { EmptyState } from "@/app/components/EmptyState";
import { YearMap } from "@/app/components/YearMap";
import { YearStats } from "@/app/components/YearStats";
import { getAllTime } from "@/app/db/queries";

export const dynamic = "force-dynamic";

export default async function AllTimePage() {
  const data = await getAllTime();
  if (data.visits.length === 0) {
    return (
      <EmptyState
        title="No lifetime map yet"
        description="Import Timeline data to build a heatmap-style lifetime view and year-over-year stats."
        actionHref="/import"
        actionLabel="Import Timeline"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-moss">All time</p>
        <h1 className="text-4xl font-semibold text-ink">Lifetime travel map</h1>
      </div>
      <YearMap
        heatmap
        points={data.visits.map((visit) => ({
          lat: visit.place.lat,
          lng: visit.place.lng,
          label: visit.place.displayName ?? undefined,
        }))}
      />
      <YearStats
        stats={[
          { label: "Countries", value: data.countries },
          { label: "Places", value: data.places },
          { label: "Years", value: data.years.length },
          { label: "Visits", value: data.visits.length },
        ]}
      />
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-ink">Year over year</h2>
        <div className="mt-5 divide-y divide-stone-200">
          {data.years.map((year) => (
            <Link
              href={`/year/${year.year}`}
              key={year.year}
              className="grid gap-2 py-4 text-sm transition hover:text-moss sm:grid-cols-5"
            >
              <span className="text-lg font-semibold text-ink">{year.year}</span>
              <span>{year.countries} countries</span>
              <span>{year.daysAway} days away</span>
              <span>{year.tripCount} trips</span>
              <span>{year.visitCount} visits</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
