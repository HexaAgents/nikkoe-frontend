import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchableSupplierPicker } from "@/components/common/SearchableSupplierPicker";
import { SearchablePartPicker } from "@/components/common/SearchablePartPicker";
import { InvoiceContextSummary } from "@/components/common/PartLineCard";
import { useSuppliers } from "@/hooks/queries";
import type { ParseContext, ParsedLineContext } from "@/types/invoice.types";

interface ResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Full parse context produced by streamParseInvoice. */
  parseContext: ParseContext | null;
  /** Supplier currently selected on the form, used to mark the supplier
   *  step resolved once the user picks one. */
  supplierId: string;
  /** Parts state from the form (item_id per line, in invoice order). */
  parts: { item_id: string }[];
  /** Called when the user picks a supplier from the dialog. */
  onSelectSupplier: (id: string) => void;
  /** Called when the user picks a part from the dialog for a given line. */
  onSelectPart: (lineIndex: number, itemId: string) => void;
  /** Open the prefilled AddSupplierModal. */
  onCreateSupplier: (name: string) => void;
  /** Open the prefilled AddItemModal for a given unresolved line. */
  onCreatePart: (lineIndex: number, ctx: ParsedLineContext) => void;
}

type Step =
  | { kind: "supplier"; supplierName: string }
  | { kind: "line"; lineIndex: number; context: ParsedLineContext };

/**
 * Guided resolution dialog. Walks the user through every unresolved
 * supplier/line one at a time, always showing the PDF context next to
 * the picker and a "create new" shortcut.
 *
 * Mirrors the inline amber enrichment on the form, so the user can
 * work either place — both read the same ParseContext and write back
 * to the same form state.
 */
export function ResolutionDialog({
  open,
  onOpenChange,
  parseContext,
  supplierId,
  parts,
  onSelectSupplier,
  onSelectPart,
  onCreateSupplier,
  onCreatePart,
}: ResolutionDialogProps) {
  const { data: suppliers } = useSuppliers();

  const steps: Step[] = useMemo(() => {
    if (!parseContext) return [];
    const out: Step[] = [];
    const supplierUnresolved =
      !!parseContext.supplierName && !parseContext.supplierMatched && !supplierId;
    if (supplierUnresolved && parseContext.supplierName) {
      out.push({ kind: "supplier", supplierName: parseContext.supplierName });
    }
    parseContext.lines.forEach((ctx, lineIndex) => {
      const partItemId = parts[lineIndex]?.item_id ?? "";
      if (!partItemId) {
        out.push({ kind: "line", lineIndex, context: ctx });
      }
    });
    return out;
  }, [parseContext, supplierId, parts]);

  const [stepIndex, setStepIndex] = useState(0);

  // Keep the cursor in range as the user resolves items and steps fall off.
  useEffect(() => {
    if (!open) return;
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [open, steps.length, stepIndex]);

  // Reset to the first step whenever the dialog reopens.
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  if (!parseContext) return null;

  const totalInvoiceLines = parseContext.lines.length;
  const step: Step | undefined = steps[stepIndex];
  const allResolved = steps.length === 0;
  const hasMultipleSteps = steps.length > 1;

  const goPrev = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNext = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve invoice issues</DialogTitle>
          <DialogDescription>
            Match items from the invoice to records in your database.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice summary — muted, compact, always visible */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Invoice
          </div>
          <dl className="space-y-2 text-sm">
            {parseContext.supplierName && (
              <div className="flex items-start gap-4">
                <dt className="w-28 shrink-0 text-muted-foreground">Supplier:</dt>
                <dd className="min-w-0 flex-1 truncate">{parseContext.supplierName}</dd>
              </div>
            )}
            {parseContext.reference && (
              <div className="flex items-start gap-4">
                <dt className="w-28 shrink-0 text-muted-foreground">Reference:</dt>
                <dd className="min-w-0 flex-1 truncate">{parseContext.reference}</dd>
              </div>
            )}
            <div className="flex items-start gap-4">
              <dt className="w-28 shrink-0 text-muted-foreground">Line items:</dt>
              <dd className="min-w-0 flex-1">{totalInvoiceLines}</dd>
            </div>
            {parseContext.currencySymbol && (
              <div className="flex items-start gap-4">
                <dt className="w-28 shrink-0 text-muted-foreground">Currency:</dt>
                <dd className="min-w-0 flex-1">{parseContext.currencySymbol}</dd>
              </div>
            )}
          </dl>
        </div>

        {allResolved ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-sm font-medium">All issues resolved</p>
            <p className="text-sm text-muted-foreground">
              Close this dialog and finish creating the receipt.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {hasMultipleSteps && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Step {stepIndex + 1} of {steps.length}
                </span>
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 w-6 rounded-full transition-colors",
                        i === stepIndex ? "bg-primary" : "bg-muted",
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {step && (
              <StepBody
                step={step}
                suppliers={suppliers}
                currencySymbol={parseContext.currencySymbol}
                onSelectSupplier={onSelectSupplier}
                onSelectPart={onSelectPart}
                onCreateSupplier={onCreateSupplier}
                onCreatePart={onCreatePart}
              />
            )}
          </div>
        )}

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          {hasMultipleSteps ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={stepIndex === 0 || allResolved}
            >
              Previous
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {!allResolved && hasMultipleSteps && stepIndex < steps.length - 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={goNext}>
                Skip
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (allResolved || !hasMultipleSteps || stepIndex === steps.length - 1) {
                  onOpenChange(false);
                } else {
                  goNext();
                }
              }}
            >
              {allResolved || !hasMultipleSteps || stepIndex === steps.length - 1
                ? "Done"
                : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StepBodyProps {
  step: Step;
  suppliers: { id: number; name: string }[] | undefined;
  currencySymbol: string | null;
  onSelectSupplier: (id: string) => void;
  onSelectPart: (lineIndex: number, itemId: string) => void;
  onCreateSupplier: (name: string) => void;
  onCreatePart: (lineIndex: number, ctx: ParsedLineContext) => void;
}

function StepBody({
  step,
  suppliers,
  currencySymbol,
  onSelectSupplier,
  onSelectPart,
  onCreateSupplier,
  onCreatePart,
}: StepBodyProps) {
  if (step.kind === "supplier") {
    return (
      <div className="space-y-5">
        <SectionHeader
          title="Unmatched supplier"
          subtitle={
            <>
              The invoice was issued by{" "}
              <span className="font-medium text-foreground">
                “{step.supplierName}”
              </span>
              , which is not in your supplier list.
            </>
          }
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Choose an existing supplier</label>
          <SearchableSupplierPicker
            suppliers={suppliers}
            value=""
            onSelect={onSelectSupplier}
          />
        </div>

        <OrDivider />

        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={() => onCreateSupplier(step.supplierName)}
        >
          Create supplier “{step.supplierName}”
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title={`Part ${step.lineIndex + 1} — not found in database`}
        subtitle="Pick the matching part, or create a new one from the invoice data below."
      />

      <div className="rounded-lg border bg-muted/30 p-4">
        <InvoiceContextSummary context={step.context} currencySymbol={currencySymbol} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Choose an existing part</label>
        <SearchablePartPicker
          value=""
          onSelect={(id) => onSelectPart(step.lineIndex, id)}
        />
      </div>

      <OrDivider />

      <Button
        type="button"
        variant="outline"
        className="w-full justify-center"
        onClick={() => onCreatePart(step.lineIndex, step.context)}
      >
        Create part from invoice
        {step.context.partNumber && (
          <span className="ml-2 font-mono text-muted-foreground">
            “{step.context.partNumber}”
          </span>
        )}
      </Button>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        or
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
