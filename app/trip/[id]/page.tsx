import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Trip"
        title={data.trip.name}
        description={`${data.trip.startDate} to ${data.trip.endDate} · ${data.visits.length} visits`}
      />
      <YearMap points={points} path={points} />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
          <h2 className="text-lg font-semibold text-ink">Day by day</h2>
          <ol className="mt-5 list-none space-y-3 p-0">
            {data.visits.map((visit) => (
              <li key={visit.id} className="rounded-xl border border-stone-200/70 bg-stone-50/25 p-4">
                <p className="text-sm font-semibold text-ink">
                  {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(visit.arrivedAt),
                  )}
                </p>
                <Link href={`/place/${visit.place.id}`} className="mt-1 block text-sm text-stone-700 hover:text-moss">
                  {visit.place.displayName ?? "Unknown place"}
                </Link>
                <form action={splitTripAction} className="mt-3">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="visitId" value={visit.id} />
                  <button
                    type="submit"
                    className="text-xs font-semibold uppercase tracking-wider text-moss hover:text-ink"
                  >
                    Split trip here
                  </button>
                </form>
              </li>
            ))}
          </ol>
        </section>
        <aside className="space-y-6">
          <form action={saveTripAction} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
            <h2 className="text-base font-semibold text-ink">Edit trip</h2>
            <input type="hidden" name="id" value={id} />
            <label className="mt-4 block text-sm font-medium text-stone-700">
              Name
              <input
                name="name"
                defaultValue={data.trip.name}
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm shadow-card outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-stone-700">
              Notes
              <textarea
                name="notes"
                defaultValue={data.trip.notes ?? ""}
                rows={5}
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm shadow-card outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
              />
            </label>
            <button
              type="submit"
              className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-moss"
            >
              Save
            </button>
          </form>
          <form action={mergeTripAction} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
            <h2 className="text-base font-semibold text-ink">Merge into another trip</h2>
            <input type="hidden" name="id" value={id} />
            <select
              name="targetId"
              className="mt-4 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-card outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
            >
              {allTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="mt-4 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-card transition hover:border-moss hover:text-moss"
            >
              Merge
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
