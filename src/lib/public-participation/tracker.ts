import OpenAI from "openai";
import Parser from "rss-parser";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { NewsSource } from "@/lib/news/types";

type FeedItem = {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
};

type DeadlineCandidate = {
  is_deadline_notice: boolean;
  title?: string;
  description?: string;
  deadline_at?: string | null;
  committee?: string | null;
  submission_channel?: string | null;
  status?: "to_be_confirmed" | "confirmed" | "closed";
};

type SavedDeadlineRecord = {
  title: string;
  description: string;
  deadline_at: string | null;
  committee: string | null;
  submission_channel: string | null;
  source_name: string;
  source_url: string;
  status: "to_be_confirmed" | "confirmed" | "closed";
};

const parser = new Parser<Record<string, unknown>, FeedItem>();

const fallbackSources: NewsSource[] = [
  {
    id: "google-news-finance-bill-public-participation",
    name: "Google News - Public Participation Kenya Finance Bill",
    feed_url:
      "https://news.google.com/rss/search?q=Kenya%20Finance%20Bill%20public%20participation%20OR%20memoranda%20OR%20committee%20submissions&hl=en-KE&gl=KE&ceid=KE:en",
    source_url: "https://news.google.com",
    source_type: "google_news",
    active: true,
  },
  {
    id: "google-news-finance-bill-deadline",
    name: "Google News - Kenya Finance Bill Submission Deadline",
    feed_url:
      "https://news.google.com/rss/search?q=Kenya%20Finance%20Bill%20submission%20deadline%20OR%20submit%20views%20OR%20public%20hearing&hl=en-KE&gl=KE&ceid=KE:en",
    source_url: "https://news.google.com",
    source_type: "google_news",
    active: true,
  },
];

export async function fetchParticipationDeadlines() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const { data: sources, error } = await supabase
    .from("news_sources")
    .select("id, name, feed_url, source_url, source_type, active")
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  const records: SavedDeadlineRecord[] = [];
  const errors: string[] = [];
  const activeSources =
    sources && sources.length > 0 ? (sources as NewsSource[]) : fallbackSources;

  for (const source of activeSources) {
    let feed;

    try {
      feed = await parser.parseURL(source.feed_url);
    } catch (error) {
      skipped += 1;
      errors.push(
        `${source.name}: ${
          error instanceof Error ? error.message : "Feed lookup failed."
        }`,
      );
      continue;
    }

    for (const item of feed.items.slice(0, 12)) {
      const title = cleanText(item.title ?? "");
      const sourceUrl = normalizeUrl(item.link ?? "");
      const excerpt = cleanText(item.contentSnippet ?? item.content ?? "");

      if (!title || !sourceUrl || !looksLikeDeadlineNotice(title, excerpt)) {
        skipped += 1;
        continue;
      }

      scanned += 1;
      let candidate: DeadlineCandidate;

      try {
        candidate = await extractDeadlineCandidate({
          title,
          excerpt,
          sourceName: source.name,
        });
      } catch (error) {
        skipped += 1;
        errors.push(
          `${title}: ${
            error instanceof Error ? error.message : "Model extraction failed."
          }`,
        );
        continue;
      }

      if (!candidate.is_deadline_notice) {
        skipped += 1;
        continue;
      }

      const record = {
        title: candidate.title || title,
        description:
          candidate.description ||
          "A tracked public participation notice that may affect Finance Bill submissions.",
        deadline_at: candidate.deadline_at || null,
        committee: candidate.committee || null,
        submission_channel: candidate.submission_channel || null,
        source_name: source.name,
        source_url: sourceUrl,
        status:
          candidate.deadline_at && candidate.status !== "closed"
            ? "confirmed"
            : candidate.status || "to_be_confirmed",
      } satisfies SavedDeadlineRecord;

      const writeError = await saveDeadlineRecord(record);

      if (writeError) {
        skipped += 1;
        errors.push(`${record.title}: ${writeError}`);
      } else {
        updated += 1;
        records.push(record);
      }
    }
  }

  return { scanned, updated, skipped, records, errors };
}

async function saveDeadlineRecord(record: SavedDeadlineRecord) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return "SUPABASE_SERVICE_ROLE_KEY is not configured.";
  }

  const { data: existing, error: lookupError } = await supabase
    .from("public_participation_deadlines")
    .select("id")
    .eq("source_url", record.source_url)
    .maybeSingle();

  if (lookupError) {
    return lookupError.message;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("public_participation_deadlines")
      .update({
        ...record,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return error?.message ?? null;
  }

  const { error } = await supabase.from("public_participation_deadlines").insert({
    ...record,
    updated_at: new Date().toISOString(),
  });

  return error?.message ?? null;
}

async function extractDeadlineCandidate({
  title,
  excerpt,
  sourceName,
}: {
  title: string;
  excerpt: string;
  sourceName: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for deadline extraction.");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract public participation deadline data from source metadata only. Return JSON with is_deadline_notice, title, description, deadline_at, committee, submission_channel, status. Use null for unknown values. Do not invent dates.",
      },
      {
        role: "user",
        content: `Source: ${sourceName}\nTitle: ${title}\nExcerpt: ${excerpt || "No excerpt provided."}`,
      },
    ],
  });

  try {
    return JSON.parse(
      completion.choices[0]?.message.content ?? "{}",
    ) as DeadlineCandidate;
  } catch {
    return {
      is_deadline_notice: false,
    } satisfies DeadlineCandidate;
  }
}

function looksLikeDeadlineNotice(title: string, excerpt: string) {
  const text = `${title} ${excerpt}`.toLowerCase();

  return (
    text.includes("public participation") ||
    text.includes("memoranda") ||
    text.includes("memorandum") ||
    text.includes("submit views") ||
    text.includes("submission") ||
    text.includes("deadline") ||
    text.includes("committee")
  );
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url: string) {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}
