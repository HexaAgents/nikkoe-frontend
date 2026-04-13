import { Settings } from "lucide-react";
import nikkoLogo from "@/assets/nikko-logo.png";

interface MobileHeaderProps {
  onSettingsOpen: () => void;
}

export function MobileHeader({ onSettingsOpen }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-nav-dark md:hidden">
      <div className="flex items-center justify-between px-3 py-3">
        <img src={nikkoLogo} alt="Nikko" className="h-9 object-contain" />
        <button
          type="button"
          onClick={onSettingsOpen}
          className="inline-flex items-center justify-center rounded-md p-2 text-white/50 transition-colors hover:text-white/80 active:text-white"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
