import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { getSettings } from "@/app/db/queries";
import { deleteAllDataAction, saveSettingsAction } from "@/app/settings/actions";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-card outline-none focus:border-moss focus:ring-2 focus:ring-moss/20";

export default async function SettingsPage() {
  const settings = await getSettings();
  const homeLat = settings.get("home_lat");
  const homeLng = settings.get("home_lng");
  const homeRadiusKm = settings.get("home_radius_km");

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Home location drives trip detection. Export a JSON backup any time, or wipe travel data while keeping these preferences."
      />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
          <h2 className="text-lg font-semibold text-ink">Home location</h2>
          <p className="mt-1 text-sm text-stone-600">Used to decide when you are away versus at home.</p>
          <form action={saveSettingsAction} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              Home latitude
              <input
                name="homeLat"
                type="number"
                step="any"
                defaultValue={typeof homeLat === "number" ? homeLat : ""}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Home longitude
              <input
                name="homeLng"
                type="number"
                step="any"
                defaultValue={typeof homeLng === "number" ? homeLng : ""}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Home radius (km)
              <input
                name="homeRadiusKm"
                type="number"
                min="1"
                defaultValue={typeof homeRadiusKm === "number" ? homeRadiusKm : 100}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Change app password
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-moss"
            >
              Save settings
            </button>
          </form>
        </section>
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
            <h2 className="text-lg font-semibold text-ink">Export</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Download all places, visits, trips, and settings as JSON.
            </p>
            <Link
              href="/settings/export"
              className="mt-5 inline-flex rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-card transition hover:border-moss hover:text-moss"
            >
              Download JSON
            </Link>
          </section>
          <form
            action={deleteAllDataAction}
            className="rounded-2xl border border-red-200/90 bg-white p-6 shadow-card sm:p-7"
          >
            <h2 className="text-lg font-semibold text-red-900">Delete all travel data</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Removes visits, trips, places, and import history. Settings remain so you can import again with the same
              home location and password.
            </p>
            <button
              type="submit"
              className="mt-5 rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-red-800"
            >
              Delete all data
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
