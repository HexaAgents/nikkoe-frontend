import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  EyeOff,
  Settings2,
  Package,
  Users,
  Tags,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import ItemsPage from "@/pages/Items";
import SuppliersPage from "@/pages/Suppliers";
import CategoriesPage from "@/pages/Categories";
import LocationsPage from "@/pages/Locations";
import LogPage from "@/pages/Log";

type SettingsSection =
  | "general"
  | "items"
  | "suppliers"
  | "categories"
  | "locations"
  | "log";

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
      { id: "log", label: "Log", icon: ClipboardList },
    ],
  },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newUserPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newUserPassword !== newUserConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setAddingUser(true);

    try {
      const { apiFetch } = await import("@/lib/api");
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword }),
      });

      toast.success(`User ${newUserEmail} created successfully`);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setAddingUser(false);
    }
  };

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
              <Card>
                <CardHeader className="border-b pb-6">
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your account password. You'll need to enter your current password first.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleChangePassword}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[13px] text-muted-foreground">Email</p>
                        <p className="text-[13px] font-medium">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </CardContent>
                </form>
              </Card>

              <Card>
                <CardHeader className="border-b pb-6">
                  <CardTitle>Add Another User</CardTitle>
                  <CardDescription>
                    Create a new user account. The user will be able to sign in immediately with these credentials.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleAddUser}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="newUserEmail">Email</Label>
                      <Input
                        id="newUserEmail"
                        type="email"
                        placeholder="user@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUserPassword">Password</Label>
                      <div className="relative">
                        <Input
                          id="newUserPassword"
                          type={showNewUserPassword ? "text" : "password"}
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                          tabIndex={-1}
                        >
                          {showNewUserPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUserConfirmPassword">Confirm Password</Label>
                      <Input
                        id="newUserConfirmPassword"
                        type="password"
                        value={newUserConfirmPassword}
                        onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" disabled={addingUser}>
                      {addingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create User
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </div>
          )}

          {activeSection === "items" && <ItemsPage embedded />}
          {activeSection === "suppliers" && <SuppliersPage embedded />}
          {activeSection === "categories" && <CategoriesPage embedded />}
          {activeSection === "locations" && <LocationsPage embedded />}
          {activeSection === "log" && <LogPage embedded />}
        </div>
      </div>
    </MainLayout>
  );
}
