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
      className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-moss disabled:cursor-wait disabled:opacity-60"
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
      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-card transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
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
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-semibold text-stone-800" htmlFor="photos">
                Upload geotagged photos
              </label>
              <input
                id="photos"
                name="photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                className="mt-2 block w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-800 shadow-inner outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-stone-200/80 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-800 focus:border-moss focus:ring-2 focus:ring-moss/20"
              />
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Photos with GPS EXIF data will be placed on the map. Photos without location data are skipped.
              </p>
            </div>
            <div className="shrink-0">
              <UploadButton />
            </div>
          </div>
          {state.error ? (
            <p className="mt-5 rounded-xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-800">{state.error}</p>
          ) : null}
          {state.message ? (
            <p className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
              {state.message}
            </p>
          ) : null}
        </section>
      </form>

      {photos.length > 0 ? (
        <>
          <PhotoMap photos={photos} />
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
            <h2 className="text-lg font-semibold text-ink">
              {photos.length} photo{photos.length === 1 ? "" : "s"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-stone-200/80 bg-stone-50/30 shadow-card"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={`/api/photos/${photo.id}`}
                      alt={photo.filename}
                      className="h-full w-full object-cover transition hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-3 p-3.5">
                    <div>
                      <p className="truncate text-sm font-medium text-ink">
                        {[photo.city, photo.country].filter(Boolean).join(", ") || "Unknown location"}
                      </p>
                      {photo.takenAt ? <p className="text-xs text-stone-500">{formatDate(photo.takenAt)}</p> : null}
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
