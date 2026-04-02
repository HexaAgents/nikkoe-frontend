import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddLocation } from "@/hooks/useLocations";

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
      location_code: locationCode,
    });
    setLocationCode("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Add Location</DialogTitle>
        </DialogHeader>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addLocation.isPending}>
              {addLocation.isPending ? "Adding..." : "Add Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
