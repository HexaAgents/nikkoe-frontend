import { motion, type MotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const SEGMENTS = ["Items", "Sales", "Receipts"] as const;

interface SegmentedControlProps {
  activeIndex: number;
  onChange: (index: number) => void;
  /** Continuous drag progress (0–2) for real-time indicator tracking */
  dragProgress: MotionValue<number>;
}

export function SegmentedControl({
  activeIndex,
  onChange,
  dragProgress,
}: SegmentedControlProps) {
  const indicatorLeft = useTransform(dragProgress, (v: number) => {
    const clamped = Math.max(0, Math.min(v, SEGMENTS.length - 1));
    return `${(clamped / SEGMENTS.length) * 100}%`;
  });

  return (
    <div className="sticky top-[57px] z-30 bg-background px-3 pb-3 pt-2 md:hidden">
      <div
        className="relative flex bg-muted p-1"
        role="tablist"
        aria-label="Page navigation"
      >
        <motion.div
          className="absolute inset-y-1 bg-primary"
          style={{
            width: `${100 / SEGMENTS.length}%`,
            left: indicatorLeft,
          }}
          transition={{ duration: 0 }}
        />
        {SEGMENTS.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={activeIndex === i}
            onClick={() => onChange(i)}
            className={cn(
              "relative z-10 flex-1 py-2 text-center text-sm font-medium transition-colors",
              activeIndex === i
                ? "text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
