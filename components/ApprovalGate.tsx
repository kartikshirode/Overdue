"use client";

import { useState } from "react";

import { isSafeActionUrl } from "@/lib/schema";
import type { StoredTask } from "@/lib/store";
import { useStore } from "@/lib/store";

const ACTION_LABELS: Record<StoredTask["artifact_type"], string> = {
  email: "Send",
  call_script: "Copy script",
  action_link: "Open link",
};

const CONFIRMATION_DELAY_MS = 650;

type ApprovalGateProps = {
  task: StoredTask;
  onApproved: () => void;
};

function looksLikeEmail(value: string | null): value is string {
  return value !== null && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Use the document fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

function openMailDraft(task: StoredTask): void {
  if (!task.artifact) {
    return;
  }

  const recipient = looksLikeEmail(task.counterparty.contact)
    ? task.counterparty.contact
    : "";
  const subject = task.artifact.subject ?? "";
  const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(task.artifact.body)}`;
  const anchor = document.createElement("a");
  anchor.href = mailto;
  anchor.click();
}

function waitForConfirmation(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, CONFIRMATION_DELAY_MS);
  });
}

export function ApprovalGate({ task, onApproved }: ApprovalGateProps) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const disabled =
    !task.artifact || task.inFlightStage != null || isActing;

  async function handleApproval() {
    const artifact = task.artifact;
    if (!artifact || disabled) {
      return;
    }

    setIsActing(true);

    if (task.artifact_type === "email") {
      openMailDraft(task);
      await copyText(artifact.body);
      setConfirmation("Sent");
    } else if (task.artifact_type === "call_script") {
      const copied = await copyText(artifact.body);
      if (!copied) {
        setConfirmation("Copy failed");
        setIsActing(false);
        return;
      }
      setConfirmation("Copied");
    } else if (artifact.action_url && isSafeActionUrl(artifact.action_url)) {
      // Re-checked here because a stored artifact can predate the schema rule.
      // An unsafe link falls through to the copy branch instead of navigating.
      window.open(artifact.action_url, "_blank", "noopener,noreferrer");
      setConfirmation("Opened");
    } else {
      const copied = await copyText(artifact.body);
      if (!copied) {
        setConfirmation("Copy failed");
        setIsActing(false);
        return;
      }
      setConfirmation("Copied");
    }

    await waitForConfirmation();
    useStore.getState().approveTask(task.id);
    onApproved();
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleApproval}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-ochre px-5 py-2.5 text-sm font-semibold text-card transition-colors hover:bg-ochre/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-32"
    >
      {confirmation ?? ACTION_LABELS[task.artifact_type]}
    </button>
  );
}
