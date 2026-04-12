import { useLocation } from "react-router-dom";
import { Package, ShoppingCart, ClipboardList, Settings, ScrollText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/items", label: "Items", icon: Package },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/receipts", label: "Receipts", icon: ClipboardList },
  { to: "/log", label: "Log", icon: ScrollText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-nav-dark pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon }) => {
          const isActive =
            location.pathname === to || location.pathname.startsWith(to + "/");

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-white/40 active:text-white/70",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
