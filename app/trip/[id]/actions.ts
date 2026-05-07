"use server";

import { revalidatePath } from "next/cache";
import { mergeTrips, splitTripAtVisit, updateTrip } from "@/app/db/queries";

export async function saveTripAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    throw new Error("Invalid trip id");
  }
  await updateTrip(id, {
    name: String(formData.get("name") ?? "Untitled trip"),
    notes: String(formData.get("notes") ?? ""),
  });
  revalidatePath(`/trip/${id}`);
}

export async function mergeTripAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const targetId = Number(formData.get("targetId"));
  if (!Number.isInteger(id) || !Number.isInteger(targetId) || id === targetId) {
    throw new Error("Choose a different target trip.");
  }
  await mergeTrips(id, targetId);
  revalidatePath(`/trip/${targetId}`);
}

export async function splitTripAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const visitId = Number(formData.get("visitId"));
  if (!Number.isInteger(id) || !Number.isInteger(visitId)) {
    throw new Error("Choose a visit to split at.");
  }
  await splitTripAtVisit(id, visitId);
  revalidatePath(`/trip/${id}`);
}
