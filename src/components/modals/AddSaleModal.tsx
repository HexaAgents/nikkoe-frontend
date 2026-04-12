import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { AddSaleForm } from "@/components/sales/AddSaleForm";

interface AddSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSaleModal({ open, onOpenChange }: AddSaleModalProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-xl text-primary">Sale</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <AddSaleForm
          variant="dialog"
          onSuccessfulCreate={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
