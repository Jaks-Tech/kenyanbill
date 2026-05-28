import crypto from "node:crypto";
import OpenAI from "openai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAndPublishNews } from "@/lib/news/aggregator";

type GeneratedPoll = {
  question: string;
  description: string;
  options: string[];
};

type DailyPollResult = {
  kenyaDate: string;
  created: number;
  skipped: number;
  alreadyHad: number;
  newsRefresh: {
    fetched: number;
    inserted: number;
    skipped: number;
    error: string | null;
  };
};

const dailyCategory = "daily-generated";
const minimumDailyPolls = 10;

export async function generateDailyPublicPolls(): Promise<DailyPollResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const kenyaDate = getKenyaDate();
  const { startUtc, endUtc } = getKenyaDayBounds(kenyaDate);
  const newsRefresh = await refreshNewsSafely();

  const { count, error: countError } = await supabase
    .from("public_polls")
    .select("id", { count: "exact", head: true })
    .eq("category", dailyCategory)
    .gte("created_at", startUtc)
    .lt("created_at", endUtc);

  if (countError) {
    throw new Error(countError.message);
  }

  const alreadyHad = count ?? 0;

  if (alreadyHad >= minimumDailyPolls) {
    return {
      kenyaDate,
      created: 0,
      skipped: minimumDailyPolls,
      alreadyHad,
      newsRefresh,
    };
  }

  const needed = minimumDailyPolls - alreadyHad;
  const context = await getDailyPollContext();
  const generatedPolls = await generatePollIdeas({
    count: Math.max(needed, minimumDailyPolls),
    kenyaDate,
    ragContext: context.ragContext,
    newsContext: context.newsContext,
  });

  let created = 0;
  let skipped = 0;

  for (const poll of generatedPolls.slice(0, needed)) {
    const options = normalizeOptions(poll.options);

    if (!poll.question || options.length < 2) {
      skipped += 1;
      continue;
    }

    const slug = createDailyPollSlug(kenyaDate, poll.question);
    const { data, error } = await supabase
      .from("public_polls")
      .insert({
        slug,
        question: poll.question,
        description: poll.description,
        category: dailyCategory,
        anonymous_name: "Kenyan Bill Daily",
        anonymous_session_id: `daily-${kenyaDate}`,
        status: "open",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error || !data) {
      skipped += 1;
      continue;
    }

    const { error: optionsError } = await supabase.from("public_poll_options").insert(
      options.map((label) => ({
        poll_id: data.id,
        label,
      })),
    );

    if (optionsError) {
      await supabase.from("public_polls").delete().eq("id", data.id);
      skipped += 1;
      continue;
    }

    created += 1;
  }

  return {
    kenyaDate,
    created,
    skipped,
    alreadyHad,
    newsRefresh,
  };
}

async function refreshNewsSafely() {
  try {
    const result = await fetchAndPublishNews();

    return {
      fetched: result.fetched,
      inserted: result.inserted,
      skipped: result.skipped,
      error: null,
    };
  } catch (error) {
    return {
      fetched: 0,
      inserted: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "News refresh failed.",
    };
  }
}

async function getDailyPollContext() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { ragContext: "", newsContext: "" };
  }

  const [chunksResult, newsResult] = await Promise.all([
    supabase
      .from("document_chunks")
      .select("chunk_text, chunk_index, metadata")
      .order("chunk_index", { ascending: true })
      .limit(18),
    supabase
      .from("news_articles")
      .select("title, summary, excerpt, source_name, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const ragContext = (chunksResult.data ?? [])
    .map((chunk, index) => {
      const text = cleanText(String(chunk.chunk_text ?? "")).slice(0, 700);
      return `RAG ${index + 1}: ${text}`;
    })
    .join("\n\n");

  const newsContext = (newsResult.data ?? [])
    .map((article, index) => {
      const title = cleanText(String(article.title ?? ""));
      const summary = cleanText(String(article.summary ?? article.excerpt ?? ""));
      const source = cleanText(String(article.source_name ?? "source"));

      return `News ${index + 1}: ${title} (${source}) - ${summary.slice(0, 260)}`;
    })
    .join("\n");

  return { ragContext, newsContext };
}

async function generatePollIdeas({
  count,
  kenyaDate,
  ragContext,
  newsContext,
}: {
  count: number;
  kenyaDate: string;
  ragContext: string;
  newsContext: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackPolls().slice(0, count);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You generate neutral civic poll topics for Kenyan citizens. Use only the supplied Finance Bill context and news metadata. Do not invent claims. Make questions voteable, concise, and safe. Return strict JSON only.",
      },
      {
        role: "user",
        content: `Date in Kenya: ${kenyaDate}
Generate exactly ${count} public poll objects for today's Finance Bill 2026 vote page.

Rules:
- Each poll must have: question, description, options.
- question: one clear sentence under 120 characters.
- description: one neutral sentence under 180 characters explaining why the issue matters.
- options: 2 to 4 short choices, not percentages.
- Avoid duplicate topics.
- Include Finance Bill, taxes, cost of living, public participation, Parliament, business, transport, employment, digital work, counties, or credible Kenya civic issues only if supported by context.
- Do not say something is true unless the context supports it. Phrase uncertain matters as public priorities or views.

Finance Bill source context:
${ragContext || "No processed chunks available."}

Recent external news metadata:
${newsContext || "No recent news metadata available."}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message.content ?? "{}";
  const parsed = JSON.parse(raw) as { polls?: GeneratedPoll[] };
  const polls = Array.isArray(parsed.polls) ? parsed.polls : [];

  return polls.length > 0 ? polls : fallbackPolls();
}

function fallbackPolls(): GeneratedPoll[] {
  return [
    {
      question: "Which Finance Bill issue should receive the most public attention today?",
      description: "This helps surface the areas citizens want explained and debated first.",
      options: ["Tax proposals", "Cost of living", "Business impact", "Public participation"],
    },
    {
      question: "Should public participation deadlines be easier to track online?",
      description: "Clear deadlines can help more citizens submit views before decisions are made.",
      options: ["Yes", "No", "Not sure"],
    },
    {
      question: "Which sector needs clearer Finance Bill explainers?",
      description: "Sector explainers help citizens understand practical effects before voting or submitting views.",
      options: ["Transport", "Small business", "Households", "Digital work"],
    },
    {
      question: "What should Parliament prioritize when reviewing tax proposals?",
      description: "The public can weigh revenue needs against household and business pressure.",
      options: ["Fairness", "Cost of living", "Business growth", "Service delivery"],
    },
    {
      question: "Do citizens need more plain-language summaries of the Bill?",
      description: "Simpler explanations can make public participation more meaningful.",
      options: ["Yes", "No", "Only for key clauses"],
    },
    {
      question: "Which cost area worries you most when tax law changes?",
      description: "Tax changes can affect everyday budgets differently across households.",
      options: ["Food", "Fuel", "Rent", "School costs"],
    },
    {
      question: "Should every key clause have a public impact note?",
      description: "Impact notes can help citizens see who may be affected and why.",
      options: ["Yes", "No", "Only controversial clauses"],
    },
    {
      question: "How should citizens engage with Finance Bill proposals first?",
      description: "Different tools can help people learn, discuss, and submit views.",
      options: ["Read summaries", "Ask questions", "Join forums", "Submit memoranda"],
    },
    {
      question: "Which group needs the clearest tax guidance?",
      description: "Clear guidance can reduce confusion and improve compliance.",
      options: ["Employees", "SMEs", "Online workers", "County traders"],
    },
    {
      question: "Should public feedback be published in a simple tracker?",
      description: "A tracker can help citizens see whether views were received and considered.",
      options: ["Yes", "No", "Only summaries"],
    },
  ];
}

function normalizeOptions(options: string[]) {
  return Array.from(
    new Set(
      (options ?? [])
        .map((option) => cleanText(option).slice(0, 80))
        .filter(Boolean),
    ),
  ).slice(0, 4);
}

function createDailyPollSlug(kenyaDate: string, question: string) {
  const hash = crypto.createHash("sha1").update(`${kenyaDate}:${question}`).digest("hex").slice(0, 8);
  const base = question
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return `daily-${kenyaDate}-${base}-${hash}`;
}

function getKenyaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function getKenyaDayBounds(kenyaDate: string) {
  const start = new Date(`${kenyaDate}T00:00:00+03:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
  };
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
