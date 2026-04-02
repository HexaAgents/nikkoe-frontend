import { AppTopBar } from "./AppTopBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppTopBar />
      <main className="flex-1 overflow-auto bg-background px-7 pb-8 pt-6">{children}</main>
    </div>
  );
}
