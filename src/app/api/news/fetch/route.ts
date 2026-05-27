import { NextRequest, NextResponse } from "next/server";
import { fetchAndPublishNews } from "@/lib/news/aggregator";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-news-cron-secret");

  if (process.env.NEWS_CRON_SECRET && secret !== process.env.NEWS_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndPublishNews();
  return NextResponse.json(result);
}
