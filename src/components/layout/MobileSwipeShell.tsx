import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useMotionValue } from "framer-motion";
import { MobileHeader } from "./MobileHeader";
import { SegmentedControl } from "./SegmentedControl";
import { SwipeablePages } from "./SwipeablePages";
import { SettingsPanel } from "./SettingsPanel";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";

const ItemsPage = lazy(() => import("@/pages/Items"));
const SalesPage = lazy(() => import("@/pages/Sales"));
const ReceiptsPage = lazy(() => import("@/pages/Receipts"));

const ROUTES = ["/items", "/sales", "/receipts"] as const;

function routeToIndex(pathname: string): number {
  const idx = ROUTES.findIndex(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
  return idx === -1 ? 0 : idx;
}

export function MobileSwipeShell() {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dragProgress = useMotionValue(routeToIndex(location.pathname));
  const [activeIndex, setActiveIndex] = useState(() =>
    routeToIndex(location.pathname),
  );

  const handleIndexChange = useCallback((index: number) => {
    setActiveIndex(index);
    window.history.replaceState(null, "", ROUTES[index]);
  }, []);

  const pages = useMemo(
    () => [
      <Suspense key="items" fallback={<PageLoadingScreen />}>
        <ItemsPage embedded />
      </Suspense>,
      <Suspense key="sales" fallback={<PageLoadingScreen />}>
        <SalesPage embedded />
      </Suspense>,
      <Suspense key="receipts" fallback={<PageLoadingScreen />}>
        <ReceiptsPage embedded />
      </Suspense>,
    ],
    [],
  );

  return (
    <>
      <MobileHeader onSettingsOpen={() => setSettingsOpen(true)} />
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 md:hidden" />
      <SegmentedControl
        activeIndex={activeIndex}
        onChange={handleIndexChange}
        dragProgress={dragProgress}
      />
      <SwipeablePages
        pages={pages}
        activeIndex={activeIndex}
        onIndexChange={handleIndexChange}
        dragProgress={dragProgress}
      />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
