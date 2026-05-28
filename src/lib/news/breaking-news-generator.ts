import OpenAI from "openai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Define a slugify helper
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateBreakingNews(topic: string) {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not configured.");
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  // 1. Perform a web search using Tavily
  const searchResponse = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      api_key: process.env.TAVILY_API_KEY,
      query: topic, 
      search_depth: "basic",
      max_results: 5
    }),
  });

  if (!searchResponse.ok) {
    throw new Error(`Search API failed: ${searchResponse.statusText}`);
  }

  const searchData = await searchResponse.json();
  const searchContext = (searchData.results || [])
    .map((r: any) => `### Source: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.content}`)
    .join("\n\n");

  // 2. Use AI to draft the article
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `
    You are a professional, neutral news editor for Kenyan Bill.
    Based on the following search results about "${topic}", perform the following tasks:
    1.  Write a concise, factual, and neutral summary of the event (2-3 paragraphs).
    2.  Create a compelling but short headline (max 70 characters).
    3.  Identify the single most authoritative source URL from the provided links.
    4.  Extract a 1-2 sentence excerpt for the news feed.

    SEARCH CONTEXT:
    ${searchContext}

    OUTPUT FORMAT (return ONLY a JSON object):
    {
      "title": "...",
      "summary": "...",
      "source_url": "...",
      "excerpt": "..."
    }
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message.content;
  if (!content) {
    return { success: false, message: "Failed to generate content from OpenAI." };
  }

  const article = JSON.parse(content);

  // 3. Save to database
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Database client not available.");

  const slug = slugify(article.title);
  const { error } = await supabase.from("news_articles").insert({
    slug,
    title: article.title,
    summary: article.summary,
    excerpt: article.excerpt,
    original_url: article.source_url,
    source_name: new URL(article.source_url).hostname.replace(/^www\./, ""),
    status: "published",
    published_at: new Date().toISOString(),
    tags: ["breaking"], // Add the 'breaking' tag
  });

  if (error) {
    return { success: false, message: `Database error: ${error.message}` };
  }

  return { success: true, title: article.title };
}
