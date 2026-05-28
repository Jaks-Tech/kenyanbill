import OpenAI from "openai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function generateDailyPollAnalysis() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  // 1. Fetch Polls and Results
  // We'll look at polls created or ended in the last 48 hours to get a good snapshot
  const { data: polls, error: pollError } = await supabase
    .from("public_polls")
    .select(`
      id,
      question,
      description,
      category,
      created_at,
      expires_at,
      public_poll_options (
        label,
        vote_count
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  if (pollError || !polls) {
    throw new Error(pollError?.message || "Failed to fetch polls for analysis.");
  }

  if (polls.length === 0) {
    return { success: false, message: "No polls found to analyze." };
  }

  const totalVotes = polls.reduce((acc, p) => 
    acc + p.public_poll_options.reduce((sum: number, o: any) => sum + o.vote_count, 0), 0
  );

  // 2. Prepare Context for AI
  const pollContext = polls.map(p => {
    const pVotes = p.public_poll_options.reduce((sum: number, o: any) => sum + o.vote_count, 0);
    const options = p.public_poll_options.map((o: any) => 
      `- ${o.label}: ${o.vote_count} votes (${pVotes > 0 ? ((o.vote_count / pVotes) * 100).toFixed(1) : 0}%)`
    ).join("\n");
    
    return `### Question: ${p.question}\nContext: ${p.description || "N/A"}\nResults:\n${options}\nTotal Poll Votes: ${pVotes}`;
  }).join("\n\n---\n\n");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 3. Generate Analysis
  const prompt = `
You are Kenyan Bill AI, a data scientist and civic analyst.
Your task is to analyze the following public poll results regarding the Finance Bill 2026 and related matters in Kenya.

CONTEXT:
${pollContext}

TOTAL SAMPLE SIZE: ${totalVotes} votes across ${polls.length} polls.

INSTRUCTIONS:
1. Write a comprehensive "Daily Sentiment Analysis" report.
2. Structure the report as a professional blog post.
3. Include:
   - **Executive Summary**: A high-level overview of the public mood.
   - **Key Trends**: What are the most contentious issues? Where is there consensus?
   - **Deep Dive**: Pick 2-3 specific polls and analyze why people might be voting this way based on current economic context (high cost of living, taxation debates).
   - **Civic Conclusion**: What does this mean for public participation?
4. Use clear, engaging language. 
5. The tone should be objective, analytical, yet supportive of civic engagement.

OUTPUT FORMAT:
Return ONLY a JSON object:
{
  "title": "A catchy title for the analysis",
  "summary": "A 2-sentence summary for the feed",
  "content": "Full report in Markdown format"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a professional civic analyst providing data-driven reports.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const contentStr = completion.choices[0]?.message.content;
  if (!contentStr) {
    throw new Error("Failed to generate analysis from OpenAI.");
  }

  const result = JSON.parse(contentStr);
  const slug = `analysis-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 7)}`;

  // 4. Store Analysis
  const { error: insertError } = await supabase
    .from("public_poll_analyses")
    .insert({
      slug,
      title: result.title,
      summary: result.summary,
      content: result.content,
      poll_count: polls.length,
      vote_count: totalVotes,
      analyzed_at: new Date().toISOString(),
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { 
    success: true, 
    slug, 
    pollCount: polls.length, 
    voteCount: totalVotes 
  };
}

export async function listPollAnalyses(limit = 10) {
  const supabase = getSupabaseAdminClient(); // Can be server client if policies allow
  if (!supabase) return { analyses: [], error: "Supabase not configured." };

  const { data, error } = await supabase
    .from("public_poll_analyses")
    .select("*")
    .order("analyzed_at", { ascending: false })
    .limit(limit);

  return {
    analyses: data || [],
    error: error?.message || null
  };
}

export async function getPollAnalysisBySlug(slug: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { analysis: null, error: "Supabase not configured." };

  const { data, error } = await supabase
    .from("public_poll_analyses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return {
    analysis: data || null,
    error: error?.message || null
  };
}
