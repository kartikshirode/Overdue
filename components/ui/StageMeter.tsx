import type { EscalationStage } from "@/lib/schema";
import { cn } from "@/lib/utils";

const STAGES: EscalationStage[] = [1, 2, 3];

const ACTIVE_STYLES: Record<EscalationStage, string> = {
  1: "border-steel bg-steel",
  2: "border-ochre bg-ochre",
  3: "border-rust bg-rust",
};

type StageMeterProps = {
  stage: EscalationStage;
  className?: string;
};

export function StageMeter({ stage, className }: StageMeterProps) {
  return (
    <div
      className={cn("flex items-center gap-2 font-mono", className)}
      aria-label={`Escalation stage ${stage} of 3`}
    >
      {STAGES.map((item) => {
        const isActive = item === stage;

        return (
          <span
            key={item}
            className="flex items-center gap-1 text-[0.625rem] text-muted"
            aria-hidden="true"
          >
            {item}
            <span
              className={cn(
                "size-2 rounded-full border bg-card",
                isActive ? ACTIVE_STYLES[item] : "border-line",
              )}
            />
          </span>
        );
      })}
    </div>
  );
}
