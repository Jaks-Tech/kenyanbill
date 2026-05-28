import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateDailyPublicPolls } from "@/lib/public-participation/daily-polls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runDailyPollGenerator(request);
}

export async function POST(request: NextRequest) {
  return runDailyPollGenerator(request);
}

async function runDailyPollGenerator(request: NextRequest) {
  const secret = process.env.POLL_CRON_SECRET || process.env.NEWS_CRON_SECRET;

  if (secret) {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await generateDailyPublicPolls();

  revalidatePath("/public-participation");

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
