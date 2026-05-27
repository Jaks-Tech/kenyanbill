import OpenAI from "openai";
import Parser from "rss-parser";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { NewsArticle, NewsSource } from "./types";

type FeedItem = {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
};

const parser = new Parser<Record<string, unknown>, FeedItem>();

export async function listPublishedNews(limit = 20) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { articles: [] as NewsArticle[], error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("news_articles")
    .select(
      "id, slug, title, source_name, source_url, original_url, external_id, summary, excerpt, tags, status, published_at, created_at, updated_at",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    articles: (data ?? []) as NewsArticle[],
    error: error?.message ?? null,
  };
}

export async function listPublishedNewsByTags(tags: string[], limit = 6) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { articles: [] as NewsArticle[], error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("news_articles")
    .select(
      "id, slug, title, source_name, source_url, original_url, external_id, summary, excerpt, tags, status, published_at, created_at, updated_at",
    )
    .eq("status", "published")
    .overlaps("tags", tags)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    articles: (data ?? []) as NewsArticle[],
    error: error?.message ?? null,
  };
}

export async function getPublishedNewsBySlug(slug: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { article: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("news_articles")
    .select(
      "id, slug, title, source_name, source_url, original_url, external_id, summary, excerpt, tags, status, published_at, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<NewsArticle>();

  return {
    article: data,
    error: error?.message ?? null,
  };
}

export async function fetchAndPublishNews() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const { data: sources, error: sourceError } = await supabase
    .from("news_sources")
    .select("id, name, feed_url, source_url, source_type, active")
    .eq("active", true);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  let fetched = 0;
  let inserted = 0;
  let skipped = 0;

  for (const source of (sources ?? []) as NewsSource[]) {
    const feed = await parser.parseURL(source.feed_url);

    for (const item of feed.items.slice(0, 12)) {
      const title = cleanText(item.title ?? "");
      const originalUrl = normalizeGoogleNewsUrl(item.link ?? "");
      const excerpt = cleanText(item.contentSnippet ?? item.content ?? "");

      if (!title || !originalUrl) {
        skipped += 1;
        continue;
      }

      fetched += 1;

      const { data: existing } = await supabase
        .from("news_articles")
        .select("id")
        .eq("original_url", originalUrl)
        .maybeSingle();

      if (existing) {
        skipped += 1;
        continue;
      }

      const summary = await summarizeExternalNews({
        title,
        sourceName: source.name,
        excerpt,
      });
      const slug = await createUniqueNewsSlug(title, originalUrl);
      const tags = tagNews(title, excerpt);

      const { error } = await supabase.from("news_articles").insert({
        slug,
        title,
        source_name: source.name,
        source_url: source.source_url,
        original_url: originalUrl,
        external_id: item.guid ?? originalUrl,
        summary,
        excerpt,
        tags,
        status: "published",
        published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        skipped += 1;
      } else {
        inserted += 1;
      }
    }
  }

  return { fetched, inserted, skipped };
}

async function summarizeExternalNews({
  title,
  sourceName,
  excerpt,
}: {
  title: string;
  sourceName: string;
  excerpt: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    return `${sourceName} shared a report titled "${title}". Read the original source for the full story.`;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Summarize external news metadata safely. Do not add facts beyond the supplied title/excerpt. Begin with 'According to the source' or '[Source] reports'. Keep it under 55 words.",
      },
      {
        role: "user",
        content: `Source: ${sourceName}\nTitle: ${title}\nExcerpt: ${excerpt || "No excerpt provided."}`,
      },
    ],
  });

  return (
    completion.choices[0]?.message.content?.trim() ??
    `${sourceName} shared a report titled "${title}". Read the original source for the full story.`
  );
}

async function createUniqueNewsSlug(title: string, url: string) {
  const hash = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(url),
  );
  const suffix = Array.from(new Uint8Array(hash))
    .slice(0, 4)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `${slugify(title).slice(0, 80)}-${suffix}`.replace(/^-+|-+$/g, "");
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeGoogleNewsUrl(url: string) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url;
  }
}

function tagNews(title: string, excerpt: string) {
  const text = `${title} ${excerpt}`.toLowerCase();
  const tags = new Set<string>(["finance-bill-2026"]);

  if (text.includes("fuel") || text.includes("transport")) {
    tags.add("transport");
    tags.add("fuel");
  }
  if (text.includes("vat")) {
    tags.add("vat");
  }
  if (text.includes("tax")) {
    tags.add("taxation");
  }
  if (text.includes("parliament") || text.includes("mp")) {
    tags.add("parliament");
  }
  if (
    text.includes("public participation") ||
    text.includes("memoranda") ||
    text.includes("committee") ||
    text.includes("submissions") ||
    text.includes("submit views")
  ) {
    tags.add("public-participation");
  }
  if (text.includes("business") || text.includes("employer")) {
    tags.add("business");
  }
  if (text.includes("cost of living") || text.includes("household")) {
    tags.add("cost-of-living");
  }

  return Array.from(tags);
}
