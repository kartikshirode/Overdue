"use client";

import { useEffect, useState } from "react";

import { DumpBar } from "@/components/DumpBar";
import { EmptyState } from "@/components/EmptyState";
import { StageMeter } from "@/components/ui/StageMeter";
import { StateStamp } from "@/components/ui/StateStamp";
import { useStore } from "@/lib/store";

export default function Home() {
  const tasks = useStore((state) => state.tasks);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <span className="font-mono text-sm font-semibold tracking-[0.2em]">
            OVERDUE
          </span>
          <time
            dateTime="2026-07-19"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted"
          >
            SIM: 2026-07-19
          </time>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        {mounted && tasks.length === 0 ? <EmptyState /> : null}

        <DumpBar />

        {mounted && tasks.length > 0 ? (
          <section aria-labelledby="queue-heading" className="pt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h1
                id="queue-heading"
                className="font-mono text-xs font-semibold tracking-[0.14em]"
              >
                THE QUEUE
              </h1>
              <p className="font-mono text-[0.6875rem] text-muted">
                {tasks.length} {tasks.length === 1 ? "case" : "cases"}
              </p>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-sm border border-line bg-card px-4 py-4 sm:px-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <StateStamp state={task.state} />
                      <span className="font-mono text-[0.6875rem] text-muted">
                        {task.id}
                      </span>
                    </div>
                    <StageMeter stage={task.escalation_stage} />
                  </div>
                  <p className="mt-3 text-base font-medium leading-6 text-ink">
                    {task.desired_outcome || task.raw_input}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
