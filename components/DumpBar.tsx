"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useStore } from "@/lib/store";

const PLACEHOLDER =
  "Your thoughts..";

export function DumpBar() {
  const ingest = useStore((state) => state.ingest);
  const [dump, setDump] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDump = dump.trim();
    if (!trimmedDump || isExtracting) {
      return;
    }

    const taskCount = useStore.getState().tasks.length;
    setIsExtracting(true);
    setMessage(null);

    try {
      await ingest(trimmedDump);
      const { tasks, ingestError } = useStore.getState();

      if (tasks.length > taskCount) {
        setDump("");
      } else {
        setMessage(
          ingestError ?? "No tasks came back. Try naming one thing plainly.",
        );
      }
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <section
      aria-labelledby="dump-heading"
      className="border-b border-line py-8 sm:py-10"
    >
      <h2 id="dump-heading" className="sr-only">
        Add overdue tasks
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="task-dump" className="sr-only">
          Things that need doing
        </label>
        <textarea
          id="task-dump"
          value={dump}
          onChange={(event) => setDump(event.target.value)}
          placeholder={PLACEHOLDER}
          rows={3}
          disabled={isExtracting}
          className="min-h-28 w-full resize-y rounded-sm border border-line bg-card px-4 py-3 font-body text-base leading-7 text-ink placeholder:text-muted focus:border-ochre focus:outline-none focus:ring-2 focus:ring-ochre/20 disabled:cursor-wait disabled:opacity-70"
        />
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p
            className="min-h-5 text-sm text-muted"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
          <button
            type="submit"
            disabled={isExtracting || dump.trim() === ""}
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-ochre px-5 py-2.5 text-sm font-semibold text-card transition-colors hover:bg-ochre/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExtracting ? "Making the first move..." : "Make the first move"}
          </button>
        </div>
      </form>
    </section>
  );
}
