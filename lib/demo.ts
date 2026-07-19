import { LEVERAGE_RULES } from "./leverage";
import {
  ArtifactSchema,
  TaskSchema,
  type Artifact,
  type Intent,
  type LeverageItem,
  type Provenance,
} from "./schema";
import type { StoredTask } from "./store";

type DemoTask = StoredTask & { artifact: Artifact };

function copyLeverage(intent: Intent): LeverageItem[] {
  return LEVERAGE_RULES[intent].map((item) => ({ ...item }));
}

function demoProvenance(): Record<string, Provenance> {
  return {
    id: "default",
    raw_input: "extracted",
    intent: "inferred",
    "counterparty.name": "inferred",
    "counterparty.channel": "inferred",
    "counterparty.contact": "inferred",
    "counterparty.source": "inferred",
    desired_outcome: "inferred",
    leverage: "default",
    missing_info: "inferred",
    artifact_type: "inferred",
    escalation_stage: "default",
    state: "default",
    next_action_at: "default",
    confidence: "inferred",
  };
}

const DEMO_TASK_DATA: DemoTask[] = [
  {
    id: "tsk_01",
    raw_input: "refund the defective boAt headphones",
    intent: "refund_request",
    counterparty: {
      name: "boAt Support",
      channel: "email",
      contact: null,
      source: "inferred",
    },
    desired_outcome: "Receive a full refund for the defective headphones",
    leverage: copyLeverage("refund_request"),
    missing_info: ["order_id", "purchase_date"],
    artifact_type: "email",
    escalation_stage: 1,
    state: "drafted",
    next_action_at: null,
    confidence: 0.96,
    provenance: demoProvenance(),
    artifact: {
      task_id: "tsk_01",
      stage: 1,
      artifact_type: "email",
      subject: "Refund request for defective boAt headphones",
      body:
        "Hello boAt Support,\n\nI am writing about a pair of headphones that arrived defective. I would like a full refund and clear return instructions. Please confirm the next steps within five days.\n\nI can share the order details, receipt, and photos as soon as needed.\n\nThank you.",
      action_url: null,
      leverage_used: copyLeverage("refund_request"),
    },
  },
  {
    id: "tsk_02",
    raw_input: "cancel the gym membership before another renewal",
    intent: "subscription_cancel",
    counterparty: {
      name: "FitCore Gym",
      channel: "email",
      contact: "memberships@fitcore.example",
      source: "inferred",
    },
    desired_outcome: "Cancel the membership and stop future charges",
    leverage: copyLeverage("subscription_cancel"),
    missing_info: ["membership_id"],
    artifact_type: "email",
    escalation_stage: 1,
    state: "drafted",
    next_action_at: null,
    confidence: 0.94,
    provenance: demoProvenance(),
    artifact: {
      task_id: "tsk_02",
      stage: 1,
      artifact_type: "email",
      subject: "Membership cancellation request",
      body:
        "Hello FitCore team,\n\nPlease cancel my gym membership before the next renewal and stop any future charges. Please confirm the effective cancellation date and whether you need anything else from me.\n\nThank you.",
      action_url: null,
      leverage_used: copyLeverage("subscription_cancel"),
    },
  },
  {
    id: "tsk_03",
    raw_input: "chase the landlord for the tenancy deposit",
    intent: "deposit_return",
    counterparty: {
      name: "Mr Mehta",
      channel: "email",
      contact: "mehta.landlord@example.com",
      source: "inferred",
    },
    desired_outcome: "Receive the tenancy deposit or an itemised deduction list",
    leverage: copyLeverage("deposit_return"),
    missing_info: ["move_out_date", "deposit_receipt"],
    artifact_type: "email",
    escalation_stage: 1,
    state: "awaiting_reply",
    next_action_at: null,
    confidence: 0.95,
    provenance: demoProvenance(),
    artifact: {
      task_id: "tsk_03",
      stage: 1,
      artifact_type: "email",
      subject: "Return of tenancy deposit",
      body:
        "Hello Mr Mehta,\n\nI am following up about the tenancy deposit. Please return the undisputed amount or send an itemised list with evidence for any deductions within five days.\n\nPlease let me know when the transfer has been arranged.\n\nThank you.",
      action_url: null,
      leverage_used: copyLeverage("deposit_return"),
    },
  },
  {
    id: "tsk_04",
    raw_input: "reschedule the dentist appointment",
    intent: "reschedule",
    counterparty: {
      name: "Dr Shah Dental Clinic",
      channel: "phone",
      contact: "+91 22 5550 0184",
      source: "inferred",
    },
    desired_outcome: "Move the appointment to a suitable date next week",
    leverage: copyLeverage("reschedule"),
    missing_info: ["current_appointment", "preferred_slots"],
    artifact_type: "call_script",
    escalation_stage: 1,
    state: "drafted",
    next_action_at: null,
    confidence: 0.93,
    provenance: demoProvenance(),
    artifact: {
      task_id: "tsk_04",
      stage: 1,
      artifact_type: "call_script",
      subject: null,
      body:
        "Call [phone number]. Say: Hello, I am calling about my appointment with Dr Shah. I need to move it to next week. Could you check the available times and confirm whether any rescheduling fee applies? I can share my current booking details now.",
      action_url: null,
      leverage_used: copyLeverage("reschedule"),
    },
  },
  {
    id: "tsk_05",
    raw_input: "chase Northstar Studio for invoice INV-2047",
    intent: "invoice_chase",
    counterparty: {
      name: "Northstar Studio",
      channel: "email",
      contact: "accounts@northstarstudio.example",
      source: "inferred",
    },
    desired_outcome: "Receive payment for overdue invoice INV-2047",
    leverage: copyLeverage("invoice_chase"),
    missing_info: [],
    artifact_type: "action_link",
    escalation_stage: 1,
    state: "drafted",
    next_action_at: null,
    confidence: 0.97,
    provenance: demoProvenance(),
    artifact: {
      task_id: "tsk_05",
      stage: 1,
      artifact_type: "action_link",
      subject: "Invoice INV-2047 is overdue",
      body: "Open the email draft and ask Northstar Studio to pay invoice INV-2047 within five days.",
      action_url:
        "mailto:accounts@northstarstudio.example?subject=Invoice%20INV-2047%20is%20overdue",
      leverage_used: copyLeverage("invoice_chase"),
    },
  },
];

for (const task of DEMO_TASK_DATA) {
  TaskSchema.parse(task);
  ArtifactSchema.parse(task.artifact);
}

export const DEMO_TASKS: StoredTask[] = DEMO_TASK_DATA;
