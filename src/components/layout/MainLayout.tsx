import { AppTopBar } from "./AppTopBar";
import { MobileBottomNav } from "./MobileBottomNav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppTopBar />
      <main className="flex-1 overflow-auto bg-background px-4 pb-20 pt-6 md:px-7 md:pb-8">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
