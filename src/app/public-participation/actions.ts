"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createPublicPoll(formData: FormData) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Admin database key is missing.");
  }

  const question = clean(formData.get("question"));
  const description = clean(formData.get("description"));
  const anonymousName = clean(formData.get("anonymous_name")) || "True Patriot 001";
  const anonymousSessionId = clean(formData.get("anonymous_session_id"));
  const options = clean(formData.get("options"))
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!question || options.length < 2) {
    throw new Error("A poll needs a question and at least two options.");
  }

  const slug = `${slugify(question).slice(0, 72)}-${Date.now().toString(36)}`;
  const { data: poll, error: pollError } = await supabase
    .from("public_polls")
    .insert({
      slug,
      question,
      description,
      category: "citizen poll",
      anonymous_name: anonymousName,
      anonymous_session_id: anonymousSessionId,
      status: "open",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (pollError || !poll) {
    throw new Error(pollError?.message ?? "Could not create poll.");
  }

  const { error: optionsError } = await supabase.from("public_poll_options").insert(
    options.map((label) => ({
      poll_id: poll.id,
      label,
    })),
  );

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  revalidatePath("/public-participation");
}

export async function votePublicPoll(formData: FormData) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Admin database key is missing.");
  }

  const pollId = clean(formData.get("poll_id"));
  const optionId = clean(formData.get("option_id"));
  const anonymousSessionId = clean(formData.get("anonymous_session_id"));

  if (!pollId || !optionId || !anonymousSessionId) {
    throw new Error("Could not register this vote.");
  }

  const { data: poll, error: pollError } = await supabase
    .from("public_polls")
    .select("expires_at, status")
    .eq("id", pollId)
    .single<{ expires_at: string; status: string }>();

  if (pollError || !poll) {
    throw new Error(pollError?.message ?? "Poll not found.");
  }

  if (poll.status !== "open" || new Date(poll.expires_at).getTime() <= Date.now()) {
    throw new Error("This poll has ended.");
  }

  const { data: existingVote, error: existingError } = await supabase
    .from("public_poll_votes")
    .select("id, option_id")
    .eq("poll_id", pollId)
    .eq("anonymous_session_id", anonymousSessionId)
    .maybeSingle<{ id: string; option_id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingVote) {
    revalidatePath("/public-participation");
    return;
  }

  const { error } = await supabase.from("public_poll_votes").insert({
    poll_id: pollId,
    option_id: optionId,
    anonymous_session_id: anonymousSessionId,
  });

  if (error) {
    if (error.code === "23505") {
      revalidatePath("/public-participation");
      return;
    }

    throw new Error(error.message);
  }

  await supabase.rpc("adjust_public_poll_option_count", {
    target_option_id: optionId,
    vote_delta: 1,
  });

  revalidatePath("/public-participation");
}
