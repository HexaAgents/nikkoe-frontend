import { useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddLocation } from "@/hooks/mutations";

interface AddLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLocationModal({ open, onOpenChange }: AddLocationModalProps) {
  const addLocation = useAddLocation();
  const [locationCode, setLocationCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addLocation.mutateAsync({
      code: locationCode,
    });
    setLocationCode("");
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[350px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add Location</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="locationCode">Location</Label>
              <Input
                id="locationCode"
                value={locationCode}
                onChange={(e) => setLocationCode(e.target.value)}
                required
              />
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addLocation.isPending}>
              {addLocation.isPending ? "Adding..." : "Add Location"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
