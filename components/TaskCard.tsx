import { StageMeter } from "@/components/ui/StageMeter";
import { StateStamp } from "@/components/ui/StateStamp";
import type { StoredTask } from "@/lib/store";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: StoredTask;
  onReview: (id: string) => void;
};

function formatIntent(intent: StoredTask["intent"]): string {
  return intent.replaceAll("_", " ");
}

function formatNextMove(value: string): string {
  const datePrefix = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePrefix) {
    return datePrefix;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value.slice(0, 10)
    : date.toISOString().slice(0, 10);
}

export function TaskCard({ task, onReview }: TaskCardProps) {
  const isResolved = task.state === "resolved";
  const isArchived = task.state === "archived";
  const recipient = task.counterparty.name?.trim() || "unknown recipient";
  const title = task.desired_outcome || task.raw_input;

  return (
    <article
      className={cn(
        "task-card min-w-0 rounded-sm border border-line bg-card px-4 py-4 sm:px-5",
        isResolved &&
          "task-card-resolved border-pine/30 bg-pine/5 opacity-65",
        isArchived && "bg-paper opacity-50",
      )}
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

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            className={cn(
              "text-base font-semibold leading-6 text-ink",
              "break-words [overflow-wrap:anywhere]",
              isResolved && "text-pine line-through",
              isArchived && "text-muted",
            )}
          >
            {title}
          </h2>
          <p className="mt-1 break-words font-mono text-[0.6875rem] leading-5 text-muted [overflow-wrap:anywhere]">
            {formatIntent(task.intent)} - {recipient}
          </p>
          {task.state === "awaiting_reply" && task.next_action_at ? (
            <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-ochre">
              next move{" "}
              <time dateTime={task.next_action_at}>
                {formatNextMove(task.next_action_at)}
              </time>
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onReview(task.id)}
          className="shrink-0 self-start rounded-sm border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-steel/50 hover:bg-card sm:self-auto"
        >
          Review
        </button>
      </div>
    </article>
  );
}
