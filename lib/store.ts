"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEMO_TASKS } from "./demo";
import { matchesDemoDump } from "./demo-dump";
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
  // Set alongside artifactError so the draft panel can say why it failed
  // (busy, misconfigured, off-schema) instead of one catch-all line.
  artifactErrorMessage?: string;
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
const NOT_CONFIGURED_MESSAGE =
  "The drafting service is not set up right now. This one is on us, not you.";
const DRAFT_INVALID_MESSAGE =
  "The draft came back malformed. Close and reopen to try again.";

// Maps a failed request to the sentence the user sees. The status is the
// signal, not the server's error text: the route already reduced the real
// cause to a safe message, and the client stays authoritative about wording so
// nothing from upstream leaks through the body. The point of ID-5 is that a
// missing key, a busy provider, and a genuinely empty extraction now read as
// three different things instead of all blaming the user's phrasing.
function failureMessage(error: unknown): string {
  if (error instanceof ServiceError) {
    if (error.status === 429) {
      return RATE_LIMITED_MESSAGE;
    }
    if (error.status === 503) {
      return NOT_CONFIGURED_MESSAGE;
    }
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

        // Demo path: the scripted dump on an empty queue resolves straight from
        // the seed tasks, no model call. Guarded on an empty queue so it can
        // never replace work the user actually has in front of them.
        if (get().tasks.length === 0 && matchesDemoDump(dump)) {
          get().seedDemo();
          return;
        }

        try {
          const payload = await postJson("/api/extract", { dump });
          const candidates = parseCandidates(payload);
          if (candidates.length === 0) {
            // A 2xx with no usable candidates is a real empty extraction, not a
            // failure. Any config or upstream error arrives as a non-2xx and is
            // thrown by postJson, so it never reaches here. Leaving ingestError
            // null lets DumpBar show its "nothing came back" prompt.
            set({ ingestError: null });
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
        // An off-schema or mismatched response is not a transport failure, so it
        // gets its own line rather than the network wording.
        const markArtifactError = (message = DRAFT_INVALID_MESSAGE) => {
          set((state) => ({
            tasks: state.tasks.map((item) =>
              item.id === taskId &&
              item.escalation_stage === stage &&
              !item.artifact
                ? { ...item, artifactError: true, artifactErrorMessage: message }
                : item,
            ),
          }));
        };

        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId && !item.artifact
              ? {
                  ...item,
                  artifactError: false,
                  artifactErrorMessage: undefined,
                }
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
        } catch (error) {
          markArtifactError(failureMessage(error));
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
