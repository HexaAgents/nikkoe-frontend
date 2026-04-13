import { lazy, Suspense } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";

const Settings = lazy(() => import("@/pages/Settings"));

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <Suspense fallback={<PageLoadingScreen />}>
          {open && <Settings embedded />}
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}
