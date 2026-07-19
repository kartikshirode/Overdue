import type { TaskState } from "@/lib/schema";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<
  TaskState,
  { label: string; className: string }
> = {
  drafted: {
    label: "DRAFTED",
    className: "border-steel/30 bg-steel/10 text-steel",
  },
  sent: {
    label: "SENT",
    className: "border-ink/20 bg-ink/5 text-ink",
  },
  awaiting_reply: {
    label: "AWAITING",
    className: "border-ochre/30 bg-ochre/10 text-ochre",
  },
  escalate: {
    label: "ESCALATE",
    className: "border-rust/30 bg-rust/10 text-rust",
  },
  resolved: {
    label: "RESOLVED",
    className: "border-pine/30 bg-pine/10 text-pine",
  },
  archived: {
    label: "ARCHIVED",
    className: "border-line bg-paper text-muted",
  },
};

type StateStampProps = {
  state: TaskState;
  className?: string;
};

export function StateStamp({ state, className }: StateStampProps) {
  const config = STATE_STYLES[state];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-1 font-mono text-[0.625rem] font-semibold leading-none tracking-[0.12em]",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
