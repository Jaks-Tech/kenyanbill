import { NextResponse } from "next/server";
import { fetchParticipationDeadlines } from "@/lib/public-participation/tracker";

export async function POST(request: Request) {
  const cronSecret = process.env.NEWS_CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await fetchParticipationDeadlines();

  return NextResponse.json(result);
}
