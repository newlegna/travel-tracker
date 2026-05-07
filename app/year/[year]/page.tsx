import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/app/components/EmptyState";
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
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Year</p>
          <h1 className="text-4xl font-semibold text-ink">{year}</h1>
        </div>
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
      </section>
      <aside className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">Trips</h2>
          <div className="mt-4 space-y-3">
            {data.trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="block rounded-2xl border border-stone-200 p-4 transition hover:border-moss"
              >
                <span className="block font-semibold text-ink">{trip.name}</span>
                <span className="text-sm text-stone-600">
                  {trip.startDate} to {trip.endDate}
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">Top places</h2>
          <div className="mt-4 space-y-3">
            {data.stats.topPlaces.map(({ place, count }) => (
              <Link key={place.id} href={`/place/${place.id}`} className="block text-sm text-stone-700 hover:text-moss">
                {place.displayName ?? "Unknown place"} · {count} visits
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
