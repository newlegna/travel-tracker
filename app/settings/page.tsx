import Link from "next/link";
import { getSettings } from "@/app/db/queries";
import { deleteAllDataAction, saveSettingsAction } from "@/app/settings/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  const homeLat = settings.get("home_lat");
  const homeLng = settings.get("home_lng");
  const homeRadiusKm = settings.get("home_radius_km");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">Home and password</h1>
        <form action={saveSettingsAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-stone-700">
            Home latitude
            <input
              name="homeLat"
              type="number"
              step="any"
              defaultValue={typeof homeLat === "number" ? homeLat : ""}
              className="mt-1 w-full rounded-2xl border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Home longitude
            <input
              name="homeLng"
              type="number"
              step="any"
              defaultValue={typeof homeLng === "number" ? homeLng : ""}
              className="mt-1 w-full rounded-2xl border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Home radius (km)
            <input
              name="homeRadiusKm"
              type="number"
              min="1"
              defaultValue={typeof homeRadiusKm === "number" ? homeRadiusKm : 100}
              className="mt-1 w-full rounded-2xl border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Change app password
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-2xl border border-stone-300 px-3 py-2"
            />
          </label>
          <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Save settings</button>
        </form>
      </section>
      <section className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-ink">Export</h2>
          <p className="mt-2 text-stone-600">Download all places, visits, trips, and settings as JSON.</p>
          <Link
            href="/settings/export"
            className="mt-4 inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-ink"
          >
            Download JSON
          </Link>
        </div>
        <form action={deleteAllDataAction} className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-red-800">Delete all travel data</h2>
          <p className="mt-2 text-stone-600">
            Removes visits, trips, places, and import history. Settings remain so you can import again with the same
            home location and password.
          </p>
          <button className="mt-4 rounded-full bg-red-700 px-5 py-3 text-sm font-semibold text-white">
            Delete all data
          </button>
        </form>
      </section>
    </div>
  );
}
