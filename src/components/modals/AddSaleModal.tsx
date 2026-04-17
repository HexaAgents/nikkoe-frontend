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
  defaultItemId?: string;
  defaultItemLabel?: string;
}

export function AddSaleModal({ open, onOpenChange, defaultItemId, defaultItemLabel }: AddSaleModalProps) {
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
          defaultItemId={defaultItemId}
          defaultItemLabel={defaultItemLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
