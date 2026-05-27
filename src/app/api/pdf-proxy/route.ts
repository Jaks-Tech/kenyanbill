import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing PDF URL." }, { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid PDF URL." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const allowedHost = supabaseUrl ? new URL(supabaseUrl).host : null;

  if (!allowedHost || parsedUrl.host !== allowedHost) {
    return NextResponse.json({ error: "PDF host is not allowed." }, { status: 403 });
  }

  const response = await fetch(parsedUrl, {
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Could not fetch PDF." },
      { status: response.status || 502 },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "public, max-age=300",
    },
  });
}
