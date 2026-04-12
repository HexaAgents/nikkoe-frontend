import { LogOut, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import nikkoLogo from "@/assets/nikko-logo.png";

export function AppTopBar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <header className="bg-nav-dark sticky top-0 z-40 hidden w-full border-b border-white/[0.08] md:block">
        <div className="flex flex-wrap items-center justify-between gap-3 px-7 py-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-6 sm:gap-10">
            <NavLink
              to="/items"
              className="flex shrink-0 items-center gap-2.5 text-white/90 hover:text-white"
            >
              <img src={nikkoLogo} alt="Nikko" className="h-12 object-contain" />
            </NavLink>

            <nav className="flex items-center gap-1" aria-label="Main">
              <NavLink
                to="/items"
                className="relative inline-flex items-center px-3 py-2 text-sm text-white/50 transition-colors hover:text-white/80"
                activeClassName="font-medium text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary hover:text-white"
              >
                <span>Items</span>
              </NavLink>
              <NavLink
                to="/sales"
                className="relative inline-flex items-center px-3 py-2 text-sm text-white/50 transition-colors hover:text-white/80"
                activeClassName="font-medium text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary hover:text-white"
              >
                <span>Sales</span>
              </NavLink>
              <NavLink
                to="/receipts"
                className="relative inline-flex items-center px-3 py-2 text-sm text-white/50 transition-colors hover:text-white/80"
                activeClassName="font-medium text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary hover:text-white"
              >
                <span>Receipts</span>
              </NavLink>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NavLink
              to="/settings"
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
              activeClassName="text-white/90"
            >
              <Settings className="h-[15px] w-[15px] shrink-0" aria-hidden />
              <span className="hidden sm:inline">Settings</span>
            </NavLink>
            {user?.email && (
              <span className="hidden max-w-[180px] truncate text-[13px] text-white/30 lg:inline">
                {user.email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
            >
              <LogOut className="h-[15px] w-[15px] shrink-0" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
