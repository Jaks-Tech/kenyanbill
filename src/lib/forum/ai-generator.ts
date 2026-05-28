import OpenAI from "openai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { listPublishedNews, fetchAndPublishNews } from "@/lib/news/aggregator";

export async function generateDailyForumTopics() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  // 1. Gather Context
  let { articles } = await listPublishedNews(15);
  
  if (articles.length === 0) {
    try {
      await fetchAndPublishNews();
      const fresh = await listPublishedNews(15);
      articles = fresh.articles;
    } catch (e) {
      console.error("Failed to fetch news during AI generation:", e);
    }
  }

  const newsContext = articles
    .map((a) => `- [${a.source_name}] ${a.title}: ${a.summary || a.excerpt}`)
    .join("\n");

  const { data: documents } = await supabase
    .from("finance_bill_documents")
    .select("title, description, summary")
    .eq("status", "published")
    .limit(3);

  const docContext = (documents ?? [])
    .map((d) => `- ${d.title}: ${d.summary || d.description}`)
    .join("\n");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 2. Generate Topics and Polls
  const prompt = `
You are Kenyan Bill AI, a civic engagement facilitator. 
Your goal is to spark meaningful, civil, and critical discussion among Kenyan citizens regarding the Finance Bill 2026 and related economic news.

INSTRUCTIONS:
1. Generate EXACTLY 10 distinct forum thread objects AND EXACTLY 5 public poll objects.
2. For the FORUM THREADS (10):
   - At least 4 topics MUST be based on specific statements made by prominent Kenyan leaders on X (Twitter).
   - Use handles (e.g., @WilliamSRuto) and provide VALID, CLICKABLE links to their X profiles.
   - Build the discussion around their statement, seeking clarification or public opinion.
   - The remaining 6 should be a mix of Kenyan news and specific Finance Bill clauses.
3. For the PUBLIC POLLS (5):
   - These should be single-question polls about highly debated topics from news or social media.
   - Each poll must have a 'question' (max 120 chars), a 'description' (explaining the context, citing sources/links with icons if relevant), and a list of 'options' (2-4 choices).
   - Use localized English or mild Sheng to make it feel authentic to Kenyan citizens.

CONTEXT:
Latest News:
${newsContext}

Finance Bill Documents:
${docContext}

Prominent Leader Statements (X/Twitter):
- President William Ruto (@WilliamSRuto): Proposed moving tax-free PAYE threshold from 24k to 30k.
- John Mbadi (Treasury CS): Denied taxes on bread, motor vehicles, or land rent; focused on widening tax base.
- Kalonzo Musyoka (@skmusyoka): Called for rejection of the bill; warned about "hidden leases"; mobilized protests for June 25.
- National Assembly (@NAssemblyKE): Issued notices debunking land rent myths; confirmed 57 clauses total.
- Rigathi Gachagua (@rigathi): Attacked high cost of living; linked fuel prices to government corruption.
- Samuel Atandi (MP): Urged support for the emerging ODM-Ruto political cooperation.

OUTPUT FORMAT:
Return ONLY a JSON object with two keys: 'threads' and 'polls'.
{
  "threads": [{ "title": "...", "body": "...", "category": "..." }, ...],
  "polls": [{ "question": "...", "description": "...", "category": "...", "options": ["Option 1", "Option 2"] }, ...]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates structured JSON data for forum topics and polls.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw new Error("Failed to generate content from OpenAI.");
  }

  const result = JSON.parse(content);
  const threadsToInsert = Array.isArray(result.threads) ? result.threads : [];
  const pollsToInsert = Array.isArray(result.polls) ? result.polls : [];

  // 3. Insertion - Threads
  let threadCount = 0;
  for (const thread of threadsToInsert) {
    const slug = slugify(thread.title) + "-" + Math.random().toString(36).substring(2, 7);
    
    const { error } = await supabase.from("forum_threads").insert({
      slug,
      thread_type: "ai_daily_prompt",
      title: thread.title,
      body: thread.body,
      category: thread.category || "general",
      anonymous_name: "Kenyan Bill AI",
      ai_generated: true,
      status: "open",
    });

    if (!error) threadCount++;
  }

  // 4. Insertion - Polls
  let pollCount = 0;
  for (const poll of pollsToInsert) {
    const slug = "poll-" + slugify(poll.question).slice(0, 50) + "-" + Math.random().toString(36).substring(2, 7);
    
    const { data: pollData, error: pollError } = await supabase
      .from("public_polls")
      .insert({
        slug,
        question: poll.question,
        description: poll.description,
        category: poll.category || "public-participation",
        anonymous_name: "Kenyan Bill AI",
        status: "open",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single();

    if (!pollError && pollData) {
      const options = poll.options.map((label: string) => ({
        poll_id: pollData.id,
        label: label.substring(0, 100),
      }));
      
      const { error: optError } = await supabase.from("public_poll_options").insert(options);
      if (!optError) pollCount++;
    }
  }

  return { 
    totalGeneratedThreads: threadsToInsert.length, 
    insertedThreads: threadCount,
    totalGeneratedPolls: pollsToInsert.length,
    insertedPolls: pollCount 
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
