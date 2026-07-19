import { z } from "zod";

export const IntentSchema = z.enum([
  "refund_request",
  "subscription_cancel",
  "deposit_return",
  "invoice_chase",
  "reschedule",
  "complaint",
  "other",
]);
export type Intent = z.infer<typeof IntentSchema>;

export const ArtifactTypeSchema = z.enum([
  "email",
  "call_script",
  "action_link",
]);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

export const TaskStateSchema = z.enum([
  "drafted",
  "sent",
  "awaiting_reply",
  "escalate",
  "resolved",
  "archived",
]);
export type TaskState = z.infer<typeof TaskStateSchema>;

export const EscalationStageSchema = z.enum({
  opening: 1,
  firm: 2,
  formal: 3,
});
export type EscalationStage = z.infer<typeof EscalationStageSchema>;

export const ProvenanceSchema = z.enum([
  "extracted",
  "inferred",
  "default",
]);
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const LeverageSourceSchema = z.enum(["curated", "model"]);
export type LeverageSource = z.infer<typeof LeverageSourceSchema>;

export const ACTION_URL_MAX = 2000;

const SAFE_URL_PROTOCOLS = new Set(["https:", "mailto:"]);

// Only https: and mailto: may ever reach window.open. Everything else, including
// javascript:, data: and plain http:, is treated as unusable.
export function isSafeActionUrl(value: string): boolean {
  if (value.length > ACTION_URL_MAX) {
    return false;
  }

  try {
    return SAFE_URL_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

export const ActionUrlSchema = z
  .string()
  .refine(isSafeActionUrl, {
    message: "action_url must be an https: or mailto: link.",
  })
  .nullable();

export const LeverageItemSchema = z.object({
  claim: z.string().max(600),
  basis: z.string().max(600).nullable(),
  confidence: z.number(),
  source: LeverageSourceSchema,
});
export type LeverageItem = z.infer<typeof LeverageItemSchema>;

export const CounterpartySchema = z.object({
  name: z.string().max(200).nullable(),
  channel: z.enum(["email", "phone", "web"]).nullable(),
  contact: z.string().max(200).nullable(),
  source: ProvenanceSchema,
});
export type Counterparty = z.infer<typeof CounterpartySchema>;

export const TaskCandidateSchema = z.object({
  raw_input: z.string().max(2000),
  intent: IntentSchema,
  counterparty: CounterpartySchema,
  desired_outcome: z.string().max(1000),
  missing_info: z.array(z.string().max(200)).max(20),
  artifact_type: ArtifactTypeSchema,
  confidence: z.number(),
});
export type TaskCandidate = z.infer<typeof TaskCandidateSchema>;

export const TaskSchema = TaskCandidateSchema.extend({
  id: z.string().max(64),
  leverage: z.array(LeverageItemSchema).max(20),
  escalation_stage: EscalationStageSchema,
  state: TaskStateSchema,
  next_action_at: z.string().max(64).nullable(),
  provenance: z.record(z.string(), ProvenanceSchema),
});
export type Task = z.infer<typeof TaskSchema>;

export const ArtifactSchema = z.object({
  task_id: z.string(),
  stage: EscalationStageSchema,
  artifact_type: ArtifactTypeSchema,
  subject: z.string().max(300).nullable(),
  body: z.string().max(8000),
  action_url: ActionUrlSchema,
  leverage_used: z.array(LeverageItemSchema).max(20),
});
export type Artifact = z.infer<typeof ArtifactSchema>;
