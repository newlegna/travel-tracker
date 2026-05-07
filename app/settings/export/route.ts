import { exportJson } from "@/app/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(await exportJson(), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="travel-tracker-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
