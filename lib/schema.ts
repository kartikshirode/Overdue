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

export const LeverageItemSchema = z.object({
  claim: z.string(),
  basis: z.string().nullable(),
  confidence: z.number(),
  source: LeverageSourceSchema,
});
export type LeverageItem = z.infer<typeof LeverageItemSchema>;

export const CounterpartySchema = z.object({
  name: z.string().nullable(),
  channel: z.enum(["email", "phone", "web"]).nullable(),
  contact: z.string().nullable(),
  source: ProvenanceSchema,
});
export type Counterparty = z.infer<typeof CounterpartySchema>;

export const TaskCandidateSchema = z.object({
  raw_input: z.string(),
  intent: IntentSchema,
  counterparty: CounterpartySchema,
  desired_outcome: z.string(),
  missing_info: z.array(z.string()),
  artifact_type: ArtifactTypeSchema,
  confidence: z.number(),
});
export type TaskCandidate = z.infer<typeof TaskCandidateSchema>;

export const TaskSchema = TaskCandidateSchema.extend({
  id: z.string(),
  leverage: z.array(LeverageItemSchema),
  escalation_stage: EscalationStageSchema,
  state: TaskStateSchema,
  next_action_at: z.string().nullable(),
  provenance: z.record(z.string(), ProvenanceSchema),
});
export type Task = z.infer<typeof TaskSchema>;

export const ArtifactSchema = z.object({
  task_id: z.string(),
  stage: EscalationStageSchema,
  artifact_type: ArtifactTypeSchema,
  subject: z.string().nullable(),
  body: z.string(),
  action_url: z.string().nullable(),
  leverage_used: z.array(LeverageItemSchema),
});
export type Artifact = z.infer<typeof ArtifactSchema>;
