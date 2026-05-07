import { migrate } from "drizzle-orm/neon-http/migrator";
import { requireDatabase } from "@/app/db";

async function main() {
  await migrate(requireDatabase(), { migrationsFolder: "drizzle" });
}

main()
  .then(() => {
    console.log("Migrations completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
