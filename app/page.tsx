import Link from "next/link";
import { EmptyState } from "@/app/components/EmptyState";
import { PageHeader } from "@/app/components/PageHeader";
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
    <div className="space-y-10">
      <PageHeader eyebrow="Browse" title="Your years on the map" />
      <div className="space-y-7">
        {years.map((year) => (
          <article
            key={year.year}
            className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card"
          >
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:divide-x lg:divide-stone-100">
              <div className="p-6 sm:p-8">
                <Link href={`/year/${year.year}`} className="group inline-block">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Year</p>
                  <h2 className="mt-1 text-4xl font-semibold tracking-tight text-ink sm:text-5xl group-hover:text-moss">
                    {year.year}
                  </h2>
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
              <div className="border-t border-stone-100 bg-stone-50/25 p-4 sm:p-5 lg:border-t-0">
                <YearMap points={year.points} mini />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
