"use client";

import { useEffect, useState } from "react";

import { DumpBar } from "@/components/DumpBar";
import { EmptyState } from "@/components/EmptyState";
import { ReviewCard } from "@/components/ReviewCard";
import { TaskQueue } from "@/components/TaskQueue";
import { useStore } from "@/lib/store";

export default function Home() {
  const tasks = useStore((state) => state.tasks);
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function onReview(id: string) {
    setSelectedId(id);
    void useStore.getState().attachArtifact(id);
  }

  const selectedTask = selectedId
    ? tasks.find((task) => task.id === selectedId)
    : undefined;

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
          <TaskQueue tasks={tasks} onReview={onReview} />
        ) : null}
      </main>

      {selectedTask ? (
        <ReviewCard
          task={selectedTask}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}
