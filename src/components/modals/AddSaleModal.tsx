import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddSaleForm } from "@/components/sales/AddSaleForm";

interface AddSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSaleModal({ open, onOpenChange }: AddSaleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">Sale</DialogTitle>
        </DialogHeader>
        <AddSaleForm
          variant="dialog"
          onSuccessfulCreate={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
