"use client";

import { useFormState, useFormStatus } from "react-dom";
import { importAction, type ImportActionState } from "@/app/import/actions";

const initialState: ImportActionState = {};

function SubmitButton({ children, value }: { children: React.ReactNode; value: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      name="intent"
      value={value}
      disabled={pending}
      className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-moss disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Working..." : children}
    </button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

export function ImportClient() {
  const [state, formAction] = useFormState(importAction, initialState);
  const previewJson = state.preview ? JSON.stringify(state.preview) : "";

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-8">
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <label className="text-sm font-semibold text-stone-800" htmlFor="files">
                Google Timeline export
              </label>
              <input
                id="files"
                name="files"
                type="file"
                multiple
                accept=".zip,.json,application/json,application/zip"
                className="mt-2 block w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-800 shadow-inner outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-stone-200/80 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-800 focus:border-moss focus:ring-2 focus:ring-moss/20"
              />
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Upload a Google Takeout zip, a Timeline.json file, or multiple YYYY_MONTH.json files.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <label className="block text-sm font-medium text-stone-700">
                Home lat
                <input
                  name="homeLat"
                  type="number"
                  step="any"
                  defaultValue={state.preview?.home.lat}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-card outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Home lng
                <input
                  name="homeLng"
                  type="number"
                  step="any"
                  defaultValue={state.preview?.home.lng}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-card outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Home radius km
                <input
                  name="homeRadiusKm"
                  type="number"
                  min="1"
                  defaultValue={state.preview?.home.radiusKm ?? 100}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-card outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
                />
              </label>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <SubmitButton value="preview">Upload and preview</SubmitButton>
            {state.preview ? (
              <>
                <textarea name="previewJson" value={previewJson} readOnly hidden />
                <SubmitButton value="recalculate">Recalculate trips</SubmitButton>
                <SubmitButton value="commit">Commit selected trips</SubmitButton>
              </>
            ) : null}
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

        {state.preview ? (
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card sm:p-7">
            <div className="border-b border-stone-100 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Preview</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                {state.preview.visitCount} visits across {state.preview.trips.length} detected trips
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Formats: {state.preview.formats.join(", ")}. Uncheck spurious trips before committing.
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              {state.preview.trips.map((trip) => (
                <label
                  key={trip.tempId}
                  className="flex cursor-pointer gap-4 rounded-xl border border-stone-200/80 bg-stone-50/40 p-4 transition hover:border-stone-300 hover:bg-stone-50/80"
                >
                  <input
                    name="selectedTrips"
                    value={trip.tempId}
                    type="checkbox"
                    defaultChecked={trip.selected}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-300 text-moss focus:ring-moss/30"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{trip.name}</span>
                    <span className="mt-0.5 block text-sm text-stone-600">
                      {formatDate(trip.startDate)} – {formatDate(trip.endDate)} · {trip.days} days ·{" "}
                      {trip.visitIndexes.length} visits
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        ) : null}
      </form>

      {state.committed ? (
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-6 shadow-card sm:p-7">
          <h2 className="text-xl font-semibold text-ink">Import complete</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700 sm:text-base">
            Saved {state.committed.visitCount} visits and {state.committed.tripCount} trips. You can now browse the year
            stack.
          </p>
        </section>
      ) : null}
    </div>
  );
}
