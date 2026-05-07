import Link from "next/link";
import { notFound } from "next/navigation";
import { YearMap } from "@/app/components/YearMap";
import { getTrip, getTrips } from "@/app/db/queries";
import { mergeTripAction, saveTripAction, splitTripAction } from "@/app/trip/[id]/actions";

export const dynamic = "force-dynamic";

type TripPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripPage({ params }: TripPageProps) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    notFound();
  }
  const data = await getTrip(id);
  if (!data) {
    notFound();
  }
  const allTrips = (await getTrips()).filter((trip) => trip.id !== id);
  const points = data.visits.map((visit) => ({
    lat: visit.place.lat,
    lng: visit.place.lng,
    label: visit.place.displayName ?? undefined,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Trip</p>
        <h1 className="text-4xl font-semibold text-ink">{data.trip.name}</h1>
        <p className="mt-2 text-stone-600">
          {data.trip.startDate} to {data.trip.endDate} · {data.visits.length} visits
        </p>
      </div>
      <YearMap points={points} path={points} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-ink">Day by day</h2>
          <ol className="mt-5 space-y-4">
            {data.visits.map((visit) => (
              <li key={visit.id} className="rounded-2xl border border-stone-200 p-4">
                <p className="font-semibold text-ink">
                  {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(visit.arrivedAt),
                  )}
                </p>
                <Link href={`/place/${visit.place.id}`} className="mt-1 block text-stone-700 hover:text-moss">
                  {visit.place.displayName ?? "Unknown place"}
                </Link>
                <form action={splitTripAction} className="mt-3">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="visitId" value={visit.id} />
                  <button className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">
                    Split trip here
                  </button>
                </form>
              </li>
            ))}
          </ol>
        </section>
        <aside className="space-y-6">
          <form action={saveTripAction} className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">Edit trip</h2>
            <input type="hidden" name="id" value={id} />
            <label className="mt-4 block text-sm font-medium text-stone-700">
              Name
              <input
                name="name"
                defaultValue={data.trip.name}
                className="mt-1 w-full rounded-2xl border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-stone-700">
              Notes
              <textarea
                name="notes"
                defaultValue={data.trip.notes ?? ""}
                rows={5}
                className="mt-1 w-full rounded-2xl border border-stone-300 px-3 py-2"
              />
            </label>
            <button className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Save</button>
          </form>
          <form action={mergeTripAction} className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">Merge into another trip</h2>
            <input type="hidden" name="id" value={id} />
            <select name="targetId" className="mt-4 w-full rounded-2xl border border-stone-300 px-3 py-2">
              {allTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
            <button className="mt-4 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-ink">
              Merge
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
