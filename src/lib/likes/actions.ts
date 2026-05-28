"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type LikeTargetType = "poll" | "analysis";

export async function toggleSiteLike(
  targetType: LikeTargetType,
  targetId: string,
  anonymousSessionId: string,
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { success: false, message: "Database not configured." };
  }

  const sessionId = anonymousSessionId.trim();

  if (!targetId || !sessionId) {
    return { success: false, message: "Could not verify this device." };
  }

  try {
    const table = targetType === "poll" ? "public_polls" : "public_poll_analyses";
    const { data: existingLike } = await supabase
      .from("site_likes")
      .select("id")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("anonymous_session_id", sessionId)
      .maybeSingle();

    if (existingLike) {
      await supabase.from("site_likes").delete().eq("id", existingLike.id);

      const likeCount = await syncLikeCount(table, targetType, targetId);
      revalidateLikeTarget(targetType);

      return { success: true, action: "unliked", likeCount };
    }

    const { error: insertError } = await supabase.from("site_likes").insert({
      target_type: targetType,
      target_id: targetId,
      anonymous_session_id: sessionId,
    });

    if (insertError && insertError.code !== "23505") {
      throw new Error(insertError.message);
    }

    const likeCount = await syncLikeCount(table, targetType, targetId);
    revalidateLikeTarget(targetType);

    return { success: true, action: "liked", likeCount };
  } catch (error) {
    console.error("Like error:", error);
    return { success: false, message: "Failed to toggle like." };
  }
}

async function syncLikeCount(
  table: "public_polls" | "public_poll_analyses",
  targetType: LikeTargetType,
  targetId: string,
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("site_likes")
    .select("id", { count: "exact", head: true })
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (error) {
    throw new Error(error.message);
  }

  const likeCount = count ?? 0;
  const { error: updateError } = await supabase
    .from(table)
    .update({ like_count: likeCount })
    .eq("id", targetId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return likeCount;
}

function revalidateLikeTarget(targetType: LikeTargetType) {
  if (targetType === "poll") {
    revalidatePath("/public-participation");
  } else {
    revalidatePath("/public-participation/analysis", "layout");
  }
}
