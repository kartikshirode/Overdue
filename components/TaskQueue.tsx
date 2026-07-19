import { TaskCard } from "@/components/TaskCard";
import type { TaskState } from "@/lib/schema";
import type { StoredTask } from "@/lib/store";

const STATE_PRIORITY: Record<TaskState, number> = {
  drafted: 0,
  escalate: 0,
  awaiting_reply: 1,
  sent: 2,
  resolved: 3,
  archived: 4,
};

const SUMMARY_ORDER: TaskState[] = [
  "awaiting_reply",
  "drafted",
  "escalate",
  "sent",
  "resolved",
  "archived",
];

const SUMMARY_LABELS: Record<TaskState, string> = {
  drafted: "drafted",
  escalate: "to escalate",
  awaiting_reply: "awaiting",
  sent: "sent",
  resolved: "resolved",
  archived: "archived",
};

type TaskQueueProps = {
  tasks: StoredTask[];
  onReview: (id: string) => void;
};

function sortTasks(tasks: StoredTask[]): StoredTask[] {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort(
      (left, right) =>
        STATE_PRIORITY[left.task.state] - STATE_PRIORITY[right.task.state] ||
        left.index - right.index,
    )
    .map(({ task }) => task);
}

function summarizeTasks(tasks: StoredTask[]): string {
  const counts = tasks.reduce<Record<TaskState, number>>(
    (result, task) => ({
      ...result,
      [task.state]: result[task.state] + 1,
    }),
    {
      drafted: 0,
      sent: 0,
      awaiting_reply: 0,
      escalate: 0,
      resolved: 0,
      archived: 0,
    },
  );

  return SUMMARY_ORDER.flatMap((state) =>
    counts[state] > 0 ? [`${counts[state]} ${SUMMARY_LABELS[state]}`] : [],
  ).join(" - ");
}

export function TaskQueue({ tasks, onReview }: TaskQueueProps) {
  const sortedTasks = sortTasks(tasks);
  const summary = summarizeTasks(tasks);

  return (
    <section aria-labelledby="queue-heading" className="pt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h1
          id="queue-heading"
          className="font-mono text-xs font-semibold tracking-[0.14em]"
        >
          THE QUEUE
        </h1>
        <p className="text-right font-mono text-[0.6875rem] text-muted">
          {summary}
        </p>
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <TaskCard key={task.id} task={task} onReview={onReview} />
        ))}
      </div>
    </section>
  );
}
