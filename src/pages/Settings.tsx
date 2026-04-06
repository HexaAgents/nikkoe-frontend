import { useState } from "react";
import {
  Settings2,
  Package,
  Users,
  Tags,
  MapPin,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { AddUserForm } from "@/components/settings/AddUserForm";
import ItemsPage from "@/pages/Items";
import SuppliersPage from "@/pages/Suppliers";
import CategoriesPage from "@/pages/Categories";
import LocationsPage from "@/pages/Locations";

type SettingsSection =
  | "general"
  | "items"
  | "suppliers"
  | "categories"
  | "locations";

const navSections: {
  label: string;
  items: { id: SettingsSection; label: string; icon: typeof Settings2 }[];
}[] = [
  {
    label: "Account",
    items: [{ id: "general", label: "General", icon: Settings2 }],
  },
  {
    label: "Inventory",
    items: [
      { id: "items", label: "Items", icon: Package },
      { id: "suppliers", label: "Suppliers", icon: Users },
      { id: "categories", label: "Categories", icon: Tags },
      { id: "locations", label: "Locations", icon: MapPin },
    ],
  },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-5rem)] gap-8 px-1 pt-2 lg:gap-10">
        <aside className="hidden w-[220px] shrink-0 md:block">
          <div className="sticky top-20">
            <div className="pb-4">
              <h1 className="font-display text-[28px] font-normal text-foreground">Settings</h1>
              <p className="text-[13px] text-muted-foreground">Account and inventory data</p>
            </div>
            <nav className="flex flex-col gap-5" aria-label="Settings sections">
              {navSections.map((section) => (
                <div key={section.label}>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSection(item.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-none px-2.5 py-2 text-left text-sm transition-colors",
                            isActive
                              ? "bg-primary font-medium text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="block pb-4 md:hidden">
            <h1 className="font-display text-[28px] font-normal text-foreground">Settings</h1>
            <p className="text-[13px] text-muted-foreground">Account and inventory data</p>
          </div>

          {activeSection === "general" && (
            <div className="max-w-4xl space-y-6">
              <ChangePasswordForm />
              <AddUserForm />
            </div>
          )}

          {activeSection === "items" && <ItemsPage embedded />}
          {activeSection === "suppliers" && <SuppliersPage embedded />}
          {activeSection === "categories" && <CategoriesPage embedded />}
          {activeSection === "locations" && <LocationsPage embedded />}
        </div>
      </div>
    </MainLayout>
  );
}
