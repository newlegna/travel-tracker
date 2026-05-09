"use client";

import { useFormState, useFormStatus } from "react-dom";
import { deletePhotoAction, uploadPhotosAction, type PhotoUploadState } from "@/app/photos/actions";
import { PhotoMap, type PhotoPoint } from "@/app/components/PhotoMap";

const initialState: PhotoUploadState = {};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Uploading..." : "Upload photos"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function PhotosClient({ photos }: { photos: PhotoPoint[] }) {
  const [state, formAction] = useFormState(uploadPhotosAction, initialState);

  return (
    <div className="space-y-8">
      <form action={formAction}>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <label className="text-sm font-semibold text-stone-700" htmlFor="photos">
                Upload geotagged photos
              </label>
              <input
                id="photos"
                name="photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                className="mt-2 block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm"
              />
              <p className="mt-3 text-sm text-stone-600">
                Photos with GPS EXIF data will be placed on the map. Photos without location data are skipped.
              </p>
            </div>
            <div className="flex items-end">
              <UploadButton />
            </div>
          </div>
          {state.error ? (
            <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{state.error}</p>
          ) : null}
          {state.message ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{state.message}</p>
          ) : null}
        </section>
      </form>

      {photos.length > 0 ? (
        <>
          <PhotoMap photos={photos} />
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-ink">
              {photos.length} photo{photos.length === 1 ? "" : "s"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-stone-50"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={`/api/photos/${photo.id}`}
                      alt={photo.filename}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-3 p-3">
                    <div>
                      <p className="truncate text-sm font-medium text-ink">
                        {[photo.city, photo.country].filter(Boolean).join(", ") || "Unknown location"}
                      </p>
                      {photo.takenAt ? (
                        <p className="text-xs text-stone-500">{formatDate(photo.takenAt)}</p>
                      ) : null}
                    </div>
                    <form
                      action={deletePhotoAction}
                      onSubmit={(event) => {
                        if (!window.confirm(`Delete ${photo.filename}? This cannot be undone.`)) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="photoId" value={photo.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
