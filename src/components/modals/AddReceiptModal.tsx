import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddReceiptForm } from "@/components/receipts/AddReceiptForm";

interface AddReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddReceiptModal({ open, onOpenChange }: AddReceiptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">New Receipt</DialogTitle>
        </DialogHeader>
        <AddReceiptForm
          variant="dialog"
          onSuccessfulCreate={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
