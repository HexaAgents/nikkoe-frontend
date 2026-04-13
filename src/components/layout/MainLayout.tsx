import { useLocation } from "react-router-dom";
import { AppTopBar } from "./AppTopBar";
import { MobileSwipeShell } from "./MobileSwipeShell";
import { useIsMobile } from "@/hooks/use-mobile";

const SWIPE_ROUTES = ["/items", "/sales", "/receipts"];

function isSwipeRoute(pathname: string) {
  return SWIPE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();

  if (isMobile && isSwipeRoute(pathname)) {
    return (
      <div className="flex h-[100dvh] w-full flex-col bg-background">
        <MobileSwipeShell />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppTopBar />
      <main className="flex-1 overflow-auto bg-background px-5 pb-8 pt-6 md:px-10">
        {children}
      </main>
    </div>
  );
}
