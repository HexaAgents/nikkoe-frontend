import nikkoLogo from "@/assets/nikko-logo.png";
import { Loader2 } from "lucide-react";

export function PageLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <img
        src={nikkoLogo}
        alt="Nikko"
        className="h-20 animate-pulse object-contain"
      />
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function TableCardSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-none border">
      <div className="border-b">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: rows }, (_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid border-b last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }, (_, colIdx) => (
            <div key={colIdx} className="px-4 py-3">
              <div
                className="h-3.5 animate-pulse rounded bg-muted"
                style={{ width: `${50 + ((colIdx * 17 + rowIdx * 7) % 40)}%` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
