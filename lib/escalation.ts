import type { EscalationStage, Task, TaskState } from "./schema";

export const STAGE_DELAYS_DAYS = { 1: 5, 2: 12 } as const;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function now(clockOffsetMs: number): Date {
  return new Date(Date.now() + clockOffsetMs);
}

function withState(task: Task, state: TaskState): Task {
  return { ...task, state };
}

function nextActionAt(task: Task, at: Date): string | null {
  if (task.escalation_stage === 3) {
    return null;
  }

  const delayDays = STAGE_DELAYS_DAYS[task.escalation_stage];
  return new Date(at.getTime() + delayDays * MILLISECONDS_PER_DAY).toISOString();
}

export function approve(task: Task, at: Date): Task {
  const sent = withState(task, "sent");

  return {
    ...sent,
    state: "awaiting_reply",
    next_action_at: nextActionAt(sent, at),
  };
}

export function resolve(task: Task): Task {
  return withState(task, "resolved");
}

export function archive(task: Task): Task {
  return withState(task, "archived");
}

function nextStage(stage: EscalationStage): EscalationStage | null {
  if (stage === 1) {
    return 2;
  }

  if (stage === 2) {
    return 3;
  }

  return null;
}

function isReadyToEscalate(task: Task, at: Date): boolean {
  if (task.state !== "awaiting_reply" || task.next_action_at === null) {
    return false;
  }

  const dueAt = new Date(task.next_action_at).getTime();
  return Number.isFinite(dueAt) && dueAt <= at.getTime();
}

export function tick(
  tasks: Task[],
  at: Date,
): { tasks: Task[]; escalated: string[] } {
  const escalated: string[] = [];

  const updatedTasks = tasks.map((task) => {
    const stage = nextStage(task.escalation_stage);
    if (stage === null || !isReadyToEscalate(task, at)) {
      return { ...task };
    }

    escalated.push(task.id);
    return {
      ...task,
      escalation_stage: stage,
      state: "drafted" as const,
      next_action_at: null,
    };
  });

  return { tasks: updatedTasks, escalated };
}
