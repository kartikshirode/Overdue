"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { ApprovalGate } from "@/components/ApprovalGate";
import { StageMeter } from "@/components/ui/StageMeter";
import { StateStamp } from "@/components/ui/StateStamp";
import type { Artifact, LeverageItem, Provenance } from "@/lib/schema";
import type { StoredTask } from "@/lib/store";
import { useStore } from "@/lib/store";

type ReviewCardProps = {
  task: StoredTask;
  onClose: () => void;
};

type ProvenanceValueProps = {
  label: string;
  value: string;
  source: Provenance | undefined;
};

function ProvenanceValue({ label, value, source }: ProvenanceValueProps) {
  const showTag = source === "inferred" || source === "default";

  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink">
        <span>{value}</span>
        {showTag ? (
          <span className="rounded-sm border border-line bg-paper px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-muted">
            {source}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function confidencePercent(item: LeverageItem): number {
  return Math.round(Math.min(1, Math.max(0, item.confidence)) * 100);
}

function LeverageItemView({
  item,
  hedged = false,
}: {
  item: LeverageItem;
  hedged?: boolean;
}) {
  return (
    <li
      className={
        hedged
          ? "rounded-sm border border-line bg-paper p-3 text-muted"
          : "rounded-sm border border-line bg-card p-3 text-ink"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm leading-6">
          {hedged ? "This may apply: " : null}
          {item.claim}
        </p>
        {!hedged ? (
          <span className="rounded-sm border border-steel/30 bg-steel/10 px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-steel">
            curated
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[0.625rem] text-muted">
        <span>{item.basis || "basis not supplied"}</span>
        <span>{confidencePercent(item)}%</span>
      </div>
    </li>
  );
}

function updateArtifact(task: StoredTask, patch: Partial<Artifact>) {
  if (!task.artifact) {
    return;
  }

  useStore.getState().editTask(task.id, {
    artifact: { ...task.artifact, ...patch },
  });
}

function readableField(value: string): string {
  return value.replaceAll("_", " ");
}

export function ReviewCard({ task, onClose }: ReviewCardProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const artifact = task.artifact;
  const curatedLeverage =
    artifact?.leverage_used.filter((item) => item.source === "curated") ?? [];
  const modelLeverage =
    artifact?.leverage_used.filter((item) => item.source === "model") ?? [];
  const artifactLabel = task.artifact_type.replaceAll("_", " ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-sm border border-line bg-card shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h1 id="review-title" className="sr-only">
          Review task {task.id}
        </h1>

        <header className="border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4 pr-10">
            <div className="flex flex-wrap items-center gap-3">
              <StateStamp state={task.state} />
              <span className="font-mono text-[0.6875rem] text-muted">
                {task.id}
              </span>
            </div>
            <StageMeter stage={task.escalation_stage} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review"
            className="absolute right-4 top-3.5 inline-flex size-8 items-center justify-center rounded-sm border border-line bg-paper text-muted transition-colors hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>

        <div className="space-y-7 px-5 py-6 sm:px-6">
          <section aria-labelledby="draft-heading">
            <h2
              id="draft-heading"
              className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink"
            >
              {artifactLabel} draft
            </h2>

            {!artifact ? (
              <p className="mt-4 rounded-sm border border-line bg-paper px-4 py-5 text-sm text-muted">
                Drafting...
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {task.artifact_type === "email" ? (
                  <div>
                    <label
                      htmlFor={`subject-${task.id}`}
                      className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-muted"
                    >
                      Subject
                    </label>
                    <input
                      id={`subject-${task.id}`}
                      value={artifact.subject ?? ""}
                      onChange={(event) =>
                        updateArtifact(task, { subject: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-sm border border-line bg-card px-3 py-2.5 text-sm text-ink focus:border-ochre focus:outline-none focus:ring-2 focus:ring-ochre/20"
                    />
                  </div>
                ) : null}

                {task.artifact_type === "action_link" ? (
                  <div>
                    <p className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-muted">
                      Opening link
                    </p>
                    <p className="mt-1.5 break-all rounded-sm border border-line bg-paper px-3 py-2.5 font-mono text-xs text-steel">
                      {artifact.action_url || "No direct link supplied"}
                    </p>
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor={`body-${task.id}`}
                    className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-muted"
                  >
                    {task.artifact_type === "call_script" ? "Script" : "Body"}
                  </label>
                  <textarea
                    id={`body-${task.id}`}
                    value={artifact.body}
                    onChange={(event) =>
                      updateArtifact(task, { body: event.target.value })
                    }
                    rows={11}
                    className="mt-1.5 w-full resize-y rounded-sm border border-line bg-card px-3 py-3 text-sm leading-6 text-ink focus:border-ochre focus:outline-none focus:ring-2 focus:ring-ochre/20"
                  />
                </div>
              </div>
            )}
          </section>

          {artifact ? (
            <section aria-labelledby="leverage-heading">
              <h2
                id="leverage-heading"
                className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink"
              >
                Leverage
              </h2>

              {artifact.leverage_used.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  No leverage attached to this draft.
                </p>
              ) : null}

              {curatedLeverage.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {curatedLeverage.map((item, index) => (
                    <LeverageItemView key={`${item.claim}-${index}`} item={item} />
                  ))}
                </ul>
              ) : null}

              {modelLeverage.length > 0 ? (
                <div className="mt-4">
                  <h3 className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-muted">
                    Worth checking
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    These are possible leads to verify, not settled facts or legal advice.
                  </p>
                  <ul className="mt-2 space-y-2">
                    {modelLeverage.map((item, index) => (
                      <LeverageItemView
                        key={`${item.claim}-${index}`}
                        item={item}
                        hedged
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          <section aria-labelledby="provenance-heading">
            <h2
              id="provenance-heading"
              className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink"
            >
              Case details
            </h2>
            <dl className="mt-3 rounded-sm border border-line bg-card p-3">
              <ProvenanceValue
                label="Counterparty"
                value={task.counterparty.name || "unknown recipient"}
                source={task.provenance["counterparty.name"]}
              />
              <ProvenanceValue
                label="Desired outcome"
                value={task.desired_outcome || "not set"}
                source={task.provenance.desired_outcome}
              />
              <ProvenanceValue
                label="Next action"
                value={task.next_action_at?.slice(0, 10) || "not scheduled"}
                source={task.provenance.next_action_at}
              />
            </dl>
          </section>

          {task.missing_info.length > 0 ? (
            <aside className="rounded-sm border border-ochre/30 bg-ochre/10 p-4">
              <h2 className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ochre">
                Before you send
              </h2>
              <p className="mt-1 text-sm text-ink">
                Add these details if you have them:
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {task.missing_info.map((field) => (
                  <li
                    key={field}
                    className="rounded-sm border border-ochre/30 bg-card px-2 py-1 font-mono text-[0.625rem] text-ink"
                  >
                    {readableField(field)}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>

        <footer className="flex justify-end border-t border-line bg-paper px-5 py-4 sm:px-6">
          <ApprovalGate task={task} onApproved={onClose} />
        </footer>
      </section>
    </div>
  );
}
