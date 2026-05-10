import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/app/components/EmptyState";
import { PageHeader } from "@/app/components/PageHeader";
import { YearMap } from "@/app/components/YearMap";
import { YearStats } from "@/app/components/YearStats";
import { getYear } from "@/app/db/queries";

export const dynamic = "force-dynamic";

type YearPageProps = {
  params: Promise<{ year: string }>;
};

export default async function YearPage({ params }: YearPageProps) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!Number.isInteger(year)) {
    notFound();
  }

  const data = await getYear(year);
  if (data.visits.length === 0) {
    return (
      <EmptyState
        title={`No visits found for ${year}`}
        description="Import more Timeline files or choose another year from the year stack."
        actionHref="/"
        actionLabel="Back to years"
      />
    );
  }

  const points = data.visits.map((visit) => ({
    lat: visit.place.lat,
    lng: visit.place.lng,
    label: visit.place.displayName ?? undefined,
  }));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-8">
        <PageHeader eyebrow="Year" title={String(year)} />
        <YearMap points={points} path={points} />
        <YearStats
          stats={[
            { label: "Countries", value: data.stats.countries },
            { label: "Days away", value: data.stats.daysAway },
            { label: "Trips", value: data.trips.length },
            {
              label: "Longest trip",
              value: data.stats.longestTrip?.days ?? 0,
              detail: data.stats.longestTrip?.trip.name,
            },
          ]}
        />
      </div>
      <aside className="space-y-6 lg:pt-1">
        <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-base font-semibold text-ink">Trips</h2>
          <ul className="mt-4 list-none space-y-2 p-0">
            {data.trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trip/${trip.id}`}
                  className="block rounded-xl border border-stone-200/70 bg-stone-50/30 px-4 py-3 transition hover:border-moss/40 hover:bg-white"
                >
                  <span className="block font-medium text-ink">{trip.name}</span>
                  <span className="mt-0.5 block text-xs text-stone-600">
                    {trip.startDate} to {trip.endDate}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-base font-semibold text-ink">Top places</h2>
          <ul className="mt-4 list-none space-y-2.5 p-0">
            {data.stats.topPlaces.map(({ place, count }) => (
              <li key={place.id}>
                <Link
                  href={`/place/${place.id}`}
                  className="block rounded-lg px-1 py-1 text-sm text-stone-700 transition hover:bg-stone-50 hover:text-moss"
                >
                  <span className="font-medium text-ink">{place.displayName ?? "Unknown place"}</span>
                  <span className="text-stone-500"> · {count} visits</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
