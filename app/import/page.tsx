import { PageHeader } from "@/app/components/PageHeader";
import { ImportClient } from "@/app/import/ImportClient";

export default function ImportPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Import"
        title="Bring in Google Timeline"
        description="Parse old and new Google Timeline exports, reverse-geocode places offline, detect trips from your home location, preview by trip, then commit the selected visits to Postgres."
      />
      <ImportClient />
    </div>
  );
}
