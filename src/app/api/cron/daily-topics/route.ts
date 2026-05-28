import { NextResponse } from "next/server";
import { generateDailyForumTopics } from "@/lib/forum/ai-generator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const cronKey = searchParams.get("key") || authHeader?.replace("Bearer ", "");

  // Basic security check using a CRON_SECRET environment variable
  if (process.env.CRON_SECRET && cronKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateDailyForumTopics();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
