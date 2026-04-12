import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { AddReceiptForm } from "@/components/receipts/AddReceiptForm";

interface AddReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddReceiptModal({ open, onOpenChange }: AddReceiptModalProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-xl text-primary">New Receipt</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <AddReceiptForm
          variant="dialog"
          onSuccessfulCreate={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
