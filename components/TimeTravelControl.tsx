"use client";

import { useEffect, useState } from "react";

import { now } from "@/lib/escalation";
import { useStore } from "@/lib/store";

export function TimeTravelControl() {
  const clockOffsetMs = useStore((state) => state.clockOffsetMs);
  const advanceDays = useStore((state) => state.advanceDays);
  const [mounted, setMounted] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const simulatedDate = mounted
    ? now(clockOffsetMs).toISOString().slice(0, 10)
    : null;

  async function handleAdvance() {
    if (isAdvancing) {
      return;
    }

    setIsAdvancing(true);
    try {
      await advanceDays(5);
    } finally {
      setIsAdvancing(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 font-mono">
      <time
        dateTime={simulatedDate ?? undefined}
        className="text-[0.625rem] uppercase tracking-[0.06em] text-muted"
        aria-live="polite"
      >
        SIM: {simulatedDate ?? "----------"}
      </time>
      <button
        type="button"
        onClick={handleAdvance}
        disabled={isAdvancing}
        className="rounded-sm border border-line bg-card px-2.5 py-1.5 text-[0.625rem] font-medium text-ink transition-colors hover:border-steel/50 hover:bg-paper disabled:cursor-wait disabled:opacity-50"
      >
        {isAdvancing ? "Advancing..." : "Advance 5 days"}
      </button>
    </div>
  );
}
