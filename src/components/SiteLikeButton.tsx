"use client";

import { useState, useTransition, useEffect } from "react";
import { toggleSiteLike } from "@/lib/likes/actions";

type SiteLikeButtonProps = {
  targetType: "poll" | "analysis";
  targetId: string;
  initialLikeCount?: number;
};

const anonymousSessionKey = "kenyan-bill-anonymous-session";

function getAnonymousSessionId() {
  let sessionId = window.localStorage.getItem(anonymousSessionKey);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem(anonymousSessionKey, sessionId);
  }

  return sessionId;
}

export function SiteLikeButton({ targetType, targetId, initialLikeCount = 0 }: SiteLikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const localLiked = localStorage.getItem(`liked_${targetType}_${targetId}`);

    if (localLiked === "true") {
      setIsLiked(true);
    }
  }, [targetId, targetType]);

  const handleLike = () => {
    if (isPending) return;

    // Optimistic update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    startTransition(async () => {
      const result = await toggleSiteLike(
        targetType,
        targetId,
        getAnonymousSessionId(),
      );

      if (result.success) {
        if (result.action === "liked") {
          localStorage.setItem(`liked_${targetType}_${targetId}`, "true");
        } else {
          localStorage.removeItem(`liked_${targetType}_${targetId}`);
        }

        if (typeof result.likeCount === "number") {
          setLikeCount(result.likeCount);
        }
      } else {
        // Revert on failure
        setIsLiked(!newLikedState);
        setLikeCount(prev => !newLikedState ? prev + 1 : Math.max(0, prev - 1));
      }
    });
  };

  return (
    <button 
      onClick={handleLike} 
      disabled={isPending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: isLiked ? "#be3f28" : "var(--muted)",
        fontSize: "13px",
        fontWeight: 700,
        padding: "4px 8px",
        transition: "color 0.2s ease"
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      {likeCount} {likeCount === 1 ? "Like" : "Likes"}
    </button>
  );
}
