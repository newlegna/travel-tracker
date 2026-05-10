import Link from "next/link";
import { EmptyState } from "@/app/components/EmptyState";
import { PageHeader } from "@/app/components/PageHeader";
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
    <div className="space-y-10">
      <PageHeader eyebrow="All time" title="Lifetime travel map" />
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
      <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
        <h2 className="text-lg font-semibold text-ink">Year over year</h2>
        <div className="mt-4 hidden text-xs font-semibold uppercase tracking-wide text-stone-500 sm:grid sm:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,1fr))] sm:gap-x-4 sm:border-b sm:border-stone-100 sm:pb-2">
          <span>Year</span>
          <span className="text-right sm:text-left">Countries</span>
          <span className="text-right sm:text-left">Days away</span>
          <span className="text-right sm:text-left">Trips</span>
          <span className="text-right sm:text-left">Visits</span>
        </div>
        <div className="mt-2 divide-y divide-stone-100">
          {data.years.map((year) => (
            <Link
              href={`/year/${year.year}`}
              key={year.year}
              className="grid grid-cols-2 gap-x-4 gap-y-1 py-4 text-sm transition hover:text-moss sm:grid-cols-5 sm:items-center sm:gap-y-0"
            >
              <span className="col-span-2 text-base font-semibold text-ink sm:col-span-1">{year.year}</span>
              <span className="text-stone-700">
                <span className="text-stone-500 sm:hidden">Countries · </span>
                {year.countries}
              </span>
              <span className="text-stone-700">
                <span className="text-stone-500 sm:hidden">Days · </span>
                {year.daysAway}
              </span>
              <span className="text-stone-700">
                <span className="text-stone-500 sm:hidden">Trips · </span>
                {year.tripCount}
              </span>
              <span className="text-stone-700">
                <span className="text-stone-500 sm:hidden">Visits · </span>
                {year.visitCount}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
