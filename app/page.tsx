import Link from "next/link";
import { EmptyState } from "@/app/components/EmptyState";
import { YearMap } from "@/app/components/YearMap";
import { YearStats } from "@/app/components/YearStats";
import { getYears } from "@/app/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const years = await getYears();

  if (years.length === 0) {
    return (
      <EmptyState
        title="No travel data yet"
        description="Import Google Timeline once, then this page becomes a newest-first stack of years with maps, country counts, days away, and trip totals."
        actionHref="/import"
        actionLabel="Import Timeline"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Browse</p>
        <h1 className="text-4xl font-semibold text-ink">Your years on the map</h1>
      </div>
      <div className="space-y-6">
        {years.map((year) => (
          <article key={year.year} className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-6">
                <Link href={`/year/${year.year}`} className="group">
                  <p className="text-sm uppercase tracking-[0.25em] text-moss">Year</p>
                  <h2 className="mt-2 text-5xl font-semibold text-ink group-hover:text-moss">{year.year}</h2>
                </Link>
                <div className="mt-6">
                  <YearStats
                    stats={[
                      { label: "Countries", value: year.countries },
                      { label: "Days away", value: year.daysAway },
                      { label: "Trips", value: year.tripCount },
                      { label: "Visits", value: year.visitCount },
                    ]}
                  />
                </div>
              </div>
              <YearMap points={year.points} mini />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
