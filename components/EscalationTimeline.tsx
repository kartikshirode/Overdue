import type { EscalationStage } from "@/lib/schema";
import { cn } from "@/lib/utils";

const STAGES: Array<{
  stage: EscalationStage;
  label: string;
  activeClassName: string;
  pastClassName: string;
  connectorClassName: string;
}> = [
  {
    stage: 1,
    label: "Opening",
    activeClassName: "border-steel bg-steel text-card",
    pastClassName: "border-steel/30 bg-steel/10 text-steel",
    connectorClassName: "bg-steel/40",
  },
  {
    stage: 2,
    label: "Firm",
    activeClassName: "border-ochre bg-ochre text-card",
    pastClassName: "border-ochre/30 bg-ochre/10 text-ochre",
    connectorClassName: "bg-ochre/40",
  },
  {
    stage: 3,
    label: "Formal",
    activeClassName: "border-rust bg-rust text-card",
    pastClassName: "border-rust/30 bg-rust/10 text-rust",
    connectorClassName: "bg-rust/40",
  },
];

type EscalationTimelineProps = {
  stage: EscalationStage;
};

export function EscalationTimeline({ stage }: EscalationTimelineProps) {
  return (
    <ol
      className="flex w-full items-center font-mono"
      aria-label={`Escalation stage ${stage} of 3`}
    >
      {STAGES.map((item, index) => {
        const isCurrent = item.stage === stage;
        const isPast = item.stage < stage;

        return (
          <li
            key={item.stage}
            className={cn(
              "flex min-w-0 items-center",
              index < STAGES.length - 1 ? "flex-1" : "flex-none",
            )}
            aria-current={isCurrent ? "step" : undefined}
          >
            <div
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded-sm border px-2.5 py-2 text-[0.625rem] uppercase tracking-[0.08em]",
                isCurrent
                  ? item.activeClassName
                  : isPast
                    ? item.pastClassName
                    : "border-line bg-card text-muted",
                isCurrent && "font-semibold",
              )}
            >
              <span>{item.stage}</span>
              <span className="truncate">{item.label}</span>
            </div>

            {index < STAGES.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-2 h-px min-w-3 flex-1 bg-line",
                  item.stage < stage && item.connectorClassName,
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
