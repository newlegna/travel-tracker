import { getSettings } from "@/app/db/queries";
import { passwordMatches } from "@/app/lib/auth";
import { verifyPassword } from "@/app/lib/password";

export async function verifyLoginPassword(password: string) {
  const settings = await getSettings();
  const storedHash = settings.get("password_hash");
  if (typeof storedHash === "string") {
    return verifyPassword(password, storedHash);
  }
  return passwordMatches(password);
}
