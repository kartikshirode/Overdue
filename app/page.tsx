"use client";

import { useState } from "react";

import { DumpBar } from "@/components/DumpBar";
import { EmptyState } from "@/components/EmptyState";
import { ReviewCard } from "@/components/ReviewCard";
import { TaskQueue } from "@/components/TaskQueue";
import { TimeTravelControl } from "@/components/TimeTravelControl";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";

export default function Home() {
  const tasks = useStore((state) => state.tasks);
  const hydrated = useHydrated();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <span className="shrink-0 font-mono text-sm font-semibold tracking-[0.2em]">
            OVERDUE
          </span>
          <TimeTravelControl />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        {hydrated && tasks.length === 0 ? <EmptyState /> : null}

        <DumpBar />

        {hydrated && tasks.length > 0 ? (
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
