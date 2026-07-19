"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEMO_TASKS } from "./demo";
import {
  approve,
  archive,
  now,
  resolve,
  tick,
} from "./escalation";
import {
  ArtifactSchema,
  TaskCandidateSchema,
  TaskSchema,
  type Artifact,
  type EscalationStage,
  type Task,
  type TaskCandidate,
} from "./schema";
import { validateCandidates } from "./validate";

const DAY_MS = 86_400_000;

export type StoredTask = Task & {
  artifact?: Artifact;
  artifactError?: boolean;
  inFlightStage?: EscalationStage | null;
};

type StoreState = {
  tasks: StoredTask[];
  clockOffsetMs: number;
  ingestError: string | null;
};

type StoreActions = {
  ingest: (dump: string) => Promise<void>;
  attachArtifact: (taskId: string) => Promise<void>;
  approveTask: (id: string) => void;
  resolveTask: (id: string) => void;
  archiveTask: (id: string) => void;
  editTask: (id: string, patch: Partial<StoredTask>) => void;
  runTick: () => Promise<void>;
  setClockOffset: (ms: number) => void;
  advanceDays: (days: number) => Promise<void>;
  seedDemo: () => void;
  reset: () => void;
};

export type OverdueStore = StoreState & StoreActions;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

// Thrown when the request never produced a usable response. Separating this
// from an empty result is what lets the UI say something true.
class ServiceError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}.`);
    this.name = "ServiceError";
    this.status = status;
  }
}

const SERVICE_DOWN_MESSAGE =
  "The drafting service is not responding right now. Try again in a moment.";
const RATE_LIMITED_MESSAGE =
  "Too many requests just now. Wait a minute, then try again.";
const REFUSED_MESSAGE =
  "The service could not turn that into tasks. Try naming one thing plainly.";

// Deliberately does not surface the server's own error text, which can carry
// upstream provider detail.
function failureMessage(error: unknown): string {
  if (error instanceof ServiceError) {
    return error.status === 429 ? RATE_LIMITED_MESSAGE : SERVICE_DOWN_MESSAGE;
  }

  return SERVICE_DOWN_MESSAGE;
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ServiceError(response.status);
  }

  return response.json();
}

function parseCandidates(value: unknown): TaskCandidate[] {
  const candidates = asRecord(value)?.candidates;
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.flatMap((candidate) => {
    const parsed = TaskCandidateSchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
}

export const useStore = create<OverdueStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      clockOffsetMs: 0,
      ingestError: null,

      ingest: async (dump) => {
        set({ ingestError: null });

        try {
          const payload = await postJson("/api/extract", { dump });
          const candidates = parseCandidates(payload);
          if (candidates.length === 0) {
            const reported = asRecord(payload)?.error;
            set({
              ingestError: typeof reported === "string" ? REFUSED_MESSAGE : null,
            });
            return;
          }

          const snapshot = get();
          const tasks = validateCandidates(
            candidates,
            now(snapshot.clockOffsetMs),
            snapshot.tasks.map((task) => task.id),
          );
          if (tasks.length === 0) {
            return;
          }

          set((state) => ({ tasks: [...state.tasks, ...tasks] }));
        } catch (error) {
          set({ ingestError: failureMessage(error) });
        }
      },

      attachArtifact: async (taskId) => {
        const task = get().tasks.find((item) => item.id === taskId);
        if (!task || task.artifact) {
          return;
        }

        const stage = task.escalation_stage;
        const markArtifactError = () => {
          set((state) => ({
            tasks: state.tasks.map((item) =>
              item.id === taskId &&
              item.escalation_stage === stage &&
              !item.artifact
                ? { ...item, artifactError: true }
                : item,
            ),
          }));
        };

        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId && !item.artifact
              ? { ...item, artifactError: false }
              : item,
          ),
        }));

        try {
          const apiTask = TaskSchema.parse(task);
          const payload = await postJson("/api/artifact", {
            task: apiTask,
            stage: task.escalation_stage,
          });
          const parsed = ArtifactSchema.safeParse(asRecord(payload)?.artifact);

          if (
            !parsed.success ||
            parsed.data.task_id !== task.id ||
            parsed.data.stage !== task.escalation_stage ||
            parsed.data.artifact_type !== task.artifact_type
          ) {
            markArtifactError();
            return;
          }

          set((state) => ({
            tasks: state.tasks.map((item) =>
              item.id === taskId &&
              item.escalation_stage === parsed.data.stage &&
              !item.artifact
                ? { ...item, artifact: parsed.data, artifactError: false }
                : item,
            ),
          }));
        } catch {
          markArtifactError();
          return;
        }
      },

      approveTask: (id) => {
        const task = get().tasks.find((item) => item.id === id);
        if (!task || task.inFlightStage != null) {
          return;
        }

        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === id
              ? { ...item, inFlightStage: item.escalation_stage }
              : item,
          ),
        }));

        try {
          const approved = approve(task, now(get().clockOffsetMs));
          set((state) => ({
            tasks: state.tasks.map((item) =>
              item.id === id
                ? { ...item, ...approved, inFlightStage: null }
                : item,
            ),
          }));
        } catch {
          set((state) => ({
            tasks: state.tasks.map((item) =>
              item.id === id ? { ...item, inFlightStage: null } : item,
            ),
          }));
        }
      },

      resolveTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...resolve(task) } : task,
          ),
        }));
      },

      archiveTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...archive(task) } : task,
          ),
        }));
      },

      editTask: (id, patch) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...patch } : task,
          ),
        }));
      },

      runTick: async () => {
        const snapshot = get();
        const result = tick(
          snapshot.tasks,
          now(snapshot.clockOffsetMs),
        );
        const previousTasks = new Map(
          snapshot.tasks.map((task) => [task.id, task]),
        );
        const escalated = new Set(result.escalated);

        const tasks = result.tasks.map((task): StoredTask => {
          const previous = previousTasks.get(task.id);
          const stored = { ...previous, ...task };

          return escalated.has(task.id)
            ? {
                ...stored,
                artifact: undefined,
                artifactError: false,
                inFlightStage: null,
              }
            : stored;
        });

        set({ tasks });

        for (const id of result.escalated) {
          await get().attachArtifact(id);
        }
      },

      setClockOffset: (ms) => {
        set({ clockOffsetMs: ms });
      },

      advanceDays: async (days) => {
        set((state) => ({
          clockOffsetMs: state.clockOffsetMs + days * DAY_MS,
        }));
        await get().runTick();
      },

      seedDemo: () => {
        const nextActionAt = new Date(
          now(get().clockOffsetMs).getTime() + 2 * DAY_MS,
        ).toISOString();
        const tasks = DEMO_TASKS.map((task): StoredTask => ({
          ...task,
          counterparty: { ...task.counterparty },
          leverage: task.leverage.map((item) => ({ ...item })),
          missing_info: [...task.missing_info],
          provenance: { ...task.provenance },
          artifact: task.artifact
            ? {
                ...task.artifact,
                leverage_used: task.artifact.leverage_used.map((item) => ({
                  ...item,
                })),
              }
            : undefined,
          next_action_at:
            task.state === "awaiting_reply" ? nextActionAt : null,
        }));

        set({ tasks });
      },

      reset: () => {
        set({ tasks: [], clockOffsetMs: 0, ingestError: null });
      },
    }),
    {
      name: "overdue-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        clockOffsetMs: state.clockOffsetMs,
      }),
    },
  ),
);
