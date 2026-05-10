import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { YearMap } from "@/app/components/YearMap";
import { getPlace } from "@/app/db/queries";

export const dynamic = "force-dynamic";

type PlacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlacePage({ params }: PlacePageProps) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    notFound();
  }
  const data = await getPlace(id);
  if (!data.place) {
    notFound();
  }

  const years = new Set(data.visits.map((visit) => new Date(visit.arrivedAt).getUTCFullYear()));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Place"
        title={data.place.displayName ?? "Unknown place"}
        description={`Visited ${data.visits.length} ${data.visits.length === 1 ? "time" : "times"} across ${years.size} ${
          years.size === 1 ? "year" : "years"
        }.`}
      />
      <YearMap points={[{ lat: data.place.lat, lng: data.place.lng, label: data.place.displayName ?? undefined }]} />
      <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
        <h2 className="text-lg font-semibold text-ink">Visits</h2>
        <div className="mt-4 divide-y divide-stone-100">
          {data.visits.map((visit) => (
            <div key={visit.id} className="py-4 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-ink">
                {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(visit.arrivedAt))}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(visit.arrivedAt))} to{" "}
                {new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(visit.departedAt))}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
