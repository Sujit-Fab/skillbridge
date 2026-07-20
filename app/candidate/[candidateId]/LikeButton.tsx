"use client";

import { useState, useTransition } from "react";

type LikeButtonProps = {
  candidateId: string;
  initialLikesCount: number;
};

export function LikeButton({ candidateId, initialLikesCount }: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isPending, startTransition] = useTransition();

  function cheer() {
    const previousCount = likesCount;
    setLikesCount((count) => count + 1);

    startTransition(async () => {
      const response = await fetch(`/api/candidate/${candidateId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        setLikesCount(previousCount);
        return;
      }

      const payload = (await response.json()) as { likes_count?: number };

      if (typeof payload.likes_count === "number") {
        setLikesCount(payload.likes_count);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={cheer}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
      aria-label={`Cheer for this candidate. Current cheers: ${likesCount}`}
    >
      <span aria-hidden="true">👏</span>
      <span>{likesCount}</span>
      <span>cheers</span>
    </button>
  );
}
