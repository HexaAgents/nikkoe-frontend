import { type ReactNode, useRef, useCallback, useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  animate,
  type MotionValue,
  type PanInfo,
} from "framer-motion";

const VELOCITY_THRESHOLD = 300;
const OFFSET_THRESHOLD = 0.3;

interface SwipeablePagesProps {
  pages: ReactNode[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  dragProgress: MotionValue<number>;
}

export function SwipeablePages({
  pages,
  activeIndex,
  onIndexChange,
  dragProgress,
}: SwipeablePagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const isDragging = useRef(false);
  const [pageWidth, setPageWidth] = useState(window.innerWidth);
  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;

  useEffect(() => {
    const measure = () => {
      const w = containerRef.current?.offsetWidth ?? window.innerWidth;
      setPageWidth(w);
      if (!isDragging.current) {
        x.set(-activeRef.current * w);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [x]);

  useEffect(() => {
    return x.on("change", (latest) => {
      if (pageWidth > 0) dragProgress.set(-latest / pageWidth);
    });
  }, [x, dragProgress, pageWidth]);

  useEffect(() => {
    if (!isDragging.current) {
      animate(x, -activeIndex * pageWidth, {
        type: "spring",
        stiffness: 350,
        damping: 30,
      });
    }
  }, [activeIndex, x, pageWidth]);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    isDragging.current = false;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    let newIndex = activeIndex;

    if (
      Math.abs(velocity) > VELOCITY_THRESHOLD ||
      Math.abs(offset) > pageWidth * OFFSET_THRESHOLD
    ) {
      if (offset > 0 || velocity > VELOCITY_THRESHOLD) {
        newIndex = Math.max(0, activeIndex - 1);
      } else {
        newIndex = Math.min(pages.length - 1, activeIndex + 1);
      }
    }

    onIndexChange(newIndex);
    animate(x, -newIndex * pageWidth, {
      type: "spring",
      stiffness: 350,
      damping: 30,
    });
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden md:hidden">
      <motion.div
        className="flex h-full"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -(pages.length - 1) * pageWidth, right: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {pages.map((page, i) => (
          <div
            key={i}
            className="h-full flex-shrink-0 overflow-y-auto px-3 pb-8 pt-4"
            style={{ width: pageWidth }}
          >
            {page}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
