import { EmptyState } from "@/app/components/EmptyState";
import { PageHeader } from "@/app/components/PageHeader";
import { getPhotos } from "@/app/db/queries";
import { PhotosClient } from "@/app/photos/PhotosClient";
import type { PhotoPoint } from "@/app/components/PhotoMap";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const rows = await getPhotos();

  const photos: PhotoPoint[] = rows.map((row) => ({
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    filename: row.filename,
    city: row.city,
    country: row.country,
    takenAt: row.takenAt ? row.takenAt.toISOString() : null,
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Photos"
        title="Photo map"
        description="Upload geotagged photos and see exactly where they were taken on the map. Click a marker to view the photo."
      />
      <PhotosClient photos={photos} />
      {photos.length === 0 ? (
        <EmptyState
          title="No photos yet"
          description="Upload JPEG or PNG photos with GPS EXIF data to see them on the map."
        />
      ) : null}
    </div>
  );
}
