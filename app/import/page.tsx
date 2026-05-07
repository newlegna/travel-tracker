import { ImportClient } from "@/app/import/ImportClient";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Import</p>
        <h1 className="text-4xl font-semibold text-ink">Bring in Google Timeline</h1>
        <p className="mt-3 max-w-3xl text-stone-600">
          Parse old and new Google Timeline exports, reverse-geocode places offline, detect trips from your home
          location, preview by trip, then commit the selected visits to Postgres.
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
