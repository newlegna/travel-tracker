"use server";

import { revalidatePath } from "next/cache";
import { deleteAllData, setSetting } from "@/app/db/queries";
import { hashPassword } from "@/app/lib/password";

function readNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : undefined;
}

export async function saveSettingsAction(formData: FormData) {
  const homeLat = readNumber(formData, "homeLat");
  const homeLng = readNumber(formData, "homeLng");
  const homeRadiusKm = readNumber(formData, "homeRadiusKm");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (homeLat !== undefined) {
    await setSetting("home_lat", homeLat);
  }
  if (homeLng !== undefined) {
    await setSetting("home_lng", homeLng);
  }
  if (homeRadiusKm !== undefined) {
    await setSetting("home_radius_km", homeRadiusKm);
  }
  if (newPassword.length > 0) {
    await setSetting("password_hash", hashPassword(newPassword));
  }
  revalidatePath("/settings");
}

export async function deleteAllDataAction() {
  await deleteAllData();
  revalidatePath("/");
}
