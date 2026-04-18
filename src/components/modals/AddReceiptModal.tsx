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
  defaultItemId?: string;
  defaultItemLabel?: string;
}

export function AddReceiptModal({ open, onOpenChange, defaultItemId, defaultItemLabel }: AddReceiptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>New Receipt</DialogTitle>
        </DialogHeader>
        <AddReceiptForm
          variant="dialog"
          onSuccessfulCreate={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
          defaultItemId={defaultItemId}
          defaultItemLabel={defaultItemLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
