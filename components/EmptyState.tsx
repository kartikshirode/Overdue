"use client";

import { useStore } from "@/lib/store";

export function EmptyState() {
  const seedDemo = useStore((state) => state.seedDemo);

  return (
    <section className="flex flex-col items-start gap-6 pt-14 sm:pt-20">
      <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-6xl">
        <span className="block">You know what needs doing.</span>
        <span className="mt-2 block text-steel">
          Name it. Overdue makes the first move.
        </span>
      </h1>
      <button
        type="button"
        onClick={seedDemo}
        className="rounded-sm border border-line bg-card px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-steel/50 hover:bg-paper"
      >
        Load demo
      </button>
    </section>
  );
}
