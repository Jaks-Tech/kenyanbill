import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ParticipationDeadline = {
  id: string;
  title: string;
  description: string | null;
  deadline_at: string | null;
  committee: string | null;
  submission_channel: string | null;
  source_name: string | null;
  source_url: string | null;
  status: "to_be_confirmed" | "confirmed" | "closed";
  updated_at: string;
};

export type PublicPollOption = {
  id: string;
  label: string;
  vote_count: number;
};

export type PublicPoll = {
  id: string;
  slug: string;
  question: string;
  description: string | null;
  category: string;
  anonymous_name: string;
  status: "open" | "closed" | "hidden";
  created_at: string;
  expires_at: string;
  public_poll_options: PublicPollOption[];
};

export type PublicPollVoteEvent = {
  id: string;
  poll_id: string;
  created_at: string;
};

export async function listParticipationDeadlines() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      deadlines: [] as ParticipationDeadline[],
      error: "Supabase environment variables are not set.",
    };
  }

  const { data, error } = await supabase
    .from("public_participation_deadlines")
    .select(
      "id, title, description, deadline_at, committee, submission_channel, source_name, source_url, status, updated_at",
    )
    .order("deadline_at", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    return { deadlines: [] as ParticipationDeadline[], error: error.message };
  }

  return { deadlines: data ?? [], error: null };
}

export async function listOpenPublicPolls() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      polls: [] as PublicPoll[],
      error: "Supabase environment variables are not set.",
    };
  }

  const { data, error } = await supabase
    .from("public_polls")
    .select(
      "id, slug, question, description, category, anonymous_name, status, created_at, expires_at, public_poll_options(id, label, vote_count)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    return { polls: [] as PublicPoll[], error: error.message };
  }

  const polls = (data ?? []).map((poll) => ({
    ...poll,
    public_poll_options: [...(poll.public_poll_options ?? [])].sort(
      (first, second) => second.vote_count - first.vote_count,
    ),
  })) as PublicPoll[];

  return { polls, error: null };
}

export async function listRecentPublicPollVotes() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      votes: [] as PublicPollVoteEvent[],
      error: "Supabase environment variables are not set.",
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("public_poll_votes")
    .select("id, poll_id, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    return { votes: [] as PublicPollVoteEvent[], error: error.message };
  }

  return { votes: data ?? [], error: null };
}
