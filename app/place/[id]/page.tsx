import { notFound } from "next/navigation";
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
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Place</p>
        <h1 className="text-4xl font-semibold text-ink">{data.place.displayName ?? "Unknown place"}</h1>
        <p className="mt-2 text-stone-600">
          Visited {data.visits.length} {data.visits.length === 1 ? "time" : "times"} across {years.size}{" "}
          {years.size === 1 ? "year" : "years"}.
        </p>
      </div>
      <YearMap points={[{ lat: data.place.lat, lng: data.place.lng, label: data.place.displayName ?? undefined }]} />
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-ink">Visits</h2>
        <div className="mt-5 divide-y divide-stone-200">
          {data.visits.map((visit) => (
            <div key={visit.id} className="py-4">
              <p className="font-semibold text-ink">
                {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(visit.arrivedAt))}
              </p>
              <p className="text-sm text-stone-600">
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
