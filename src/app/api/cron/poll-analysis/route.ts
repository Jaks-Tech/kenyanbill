import { NextResponse } from "next/server";
import { generateDailyPollAnalysis } from "@/lib/public-participation/analysis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const cronKey = searchParams.get("key") || authHeader?.replace("Bearer ", "");

  if (process.env.CRON_SECRET && cronKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateDailyPollAnalysis();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Analysis Cron Job Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
