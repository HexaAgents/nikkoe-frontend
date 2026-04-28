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
import { Checkbox } from "@/components/ui/checkbox";
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
  /** Persist `parsedName → supplierId` so future invoices auto-resolve.
   *  Optional: dialog still works without it. */
  onCreateSupplierAlias?: (supplierId: number, parsedName: string) => void;
  /** Persist `(supplierId, parsedPartNumber) → itemId` so future invoices
   *  from this supplier auto-resolve this line. Optional. */
  onCreateSupplierPartMapping?: (
    itemId: number,
    supplierId: number,
    parsedPartNumber: string,
  ) => void;
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
  onCreateSupplierAlias,
  onCreateSupplierPartMapping,
}: ResolutionDialogProps) {
  const { data: suppliers } = useSuppliers();

  const steps: Step[] = useMemo(() => {
    if (!parseContext) return [];
    const out: Step[] = [];
    if (!supplierId) {
      out.push({ kind: "supplier", supplierName: parseContext.supplierName ?? "" });
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
                supplierId={supplierId}
                supplierName={
                  supplierId
                    ? suppliers?.find((s) => String(s.id) === supplierId)?.name ?? null
                    : null
                }
                parsedSupplierName={parseContext.supplierName}
                onSelectSupplier={onSelectSupplier}
                onSelectPart={onSelectPart}
                onCreateSupplier={onCreateSupplier}
                onCreatePart={onCreatePart}
                onCreateSupplierAlias={onCreateSupplierAlias}
                onCreateSupplierPartMapping={onCreateSupplierPartMapping}
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
  /** Currently-resolved supplier id from the form (string for picker compat). */
  supplierId: string;
  /** Canonical name of the resolved supplier, if any. */
  supplierName: string | null;
  /** Supplier name as printed on the invoice. */
  parsedSupplierName: string | null;
  onSelectSupplier: (id: string) => void;
  onSelectPart: (lineIndex: number, itemId: string) => void;
  onCreateSupplier: (name: string) => void;
  onCreatePart: (lineIndex: number, ctx: ParsedLineContext) => void;
  onCreateSupplierAlias?: (supplierId: number, parsedName: string) => void;
  onCreateSupplierPartMapping?: (
    itemId: number,
    supplierId: number,
    parsedPartNumber: string,
  ) => void;
}

function StepBody({
  step,
  suppliers,
  currencySymbol,
  supplierId,
  supplierName,
  parsedSupplierName,
  onSelectSupplier,
  onSelectPart,
  onCreateSupplier,
  onCreatePart,
  onCreateSupplierAlias,
  onCreateSupplierPartMapping,
}: StepBodyProps) {
  // Per-step "remember this mapping" toggle. Default ON because the user has
  // just told us the truth; the next invoice should benefit immediately.
  const [rememberMapping, setRememberMapping] = useState(true);
  // Tentative selection: the user has highlighted an option in the picker but
  // hasn't yet confirmed it. Nothing is written to the form or saved as a
  // mapping until they click the explicit "Save & continue" button.
  const [tentativeId, setTentativeId] = useState<string>("");

  // Reset state when the user navigates between steps so a previous step's
  // pending choice / toggle doesn't silently apply to the next.
  const stepKey = step.kind === "supplier" ? "supplier" : `line-${step.lineIndex}`;
  useEffect(() => {
    setRememberMapping(true);
    setTentativeId("");
  }, [stepKey]);

  if (step.kind === "supplier") {
    const aliasIsRedundant =
      !!step.supplierName &&
      !!suppliers &&
      suppliers.some(
        (s) => s.name.trim().toLowerCase() === step.supplierName.trim().toLowerCase(),
      );
    const canSaveAlias =
      !!step.supplierName && !!onCreateSupplierAlias && !aliasIsRedundant;

    const handleConfirm = () => {
      if (!tentativeId) return;
      onSelectSupplier(tentativeId);
      if (canSaveAlias && rememberMapping) {
        const numId = Number(tentativeId);
        if (Number.isFinite(numId)) {
          onCreateSupplierAlias?.(numId, step.supplierName);
        }
      }
    };

    return (
      <div className="space-y-5">
        <SectionHeader
          title={step.supplierName ? "Unmatched supplier" : "Missing supplier"}
          subtitle={
            step.supplierName ? (
              <>
                The invoice was issued by{" "}
                <span className="font-medium text-foreground">
                  “{step.supplierName}”
                </span>
                , which is not in your supplier list.
              </>
            ) : (
              "No supplier was detected in the invoice. Select or create one."
            )
          }
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Choose an existing supplier</label>
          <SearchableSupplierPicker
            suppliers={suppliers}
            value={tentativeId}
            onSelect={setTentativeId}
            disablePortal
          />
          {canSaveAlias && (
            <RememberMappingToggle
              checked={rememberMapping}
              onCheckedChange={setRememberMapping}
              label={
                <>
                  Always treat{" "}
                  <span className="font-medium text-foreground">
                    “{step.supplierName}”
                  </span>{" "}
                  as the supplier I pick
                </>
              }
            />
          )}
        </div>

        <Button
          type="button"
          className="w-full justify-center"
          disabled={!tentativeId}
          onClick={handleConfirm}
        >
          {canSaveAlias && rememberMapping
            ? "Save mapping & continue"
            : "Confirm supplier"}
        </Button>

        <OrDivider />

        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={() => onCreateSupplier(step.supplierName)}
        >
          {step.supplierName
            ? <>Create supplier “{step.supplierName}”</>
            : "Create new supplier"}
        </Button>
      </div>
    );
  }

  // --- Line step ---
  const supplierNumId = supplierId ? Number(supplierId) : NaN;
  const supplierResolved = Number.isFinite(supplierNumId) && supplierNumId > 0;
  const partNumber = step.context.partNumber || "";
  const canSaveMapping =
    supplierResolved && !!partNumber && !!onCreateSupplierPartMapping;

  const handleConfirm = () => {
    if (!tentativeId) return;
    onSelectPart(step.lineIndex, tentativeId);
    if (canSaveMapping && rememberMapping) {
      const itemId = Number(tentativeId);
      if (Number.isFinite(itemId)) {
        onCreateSupplierPartMapping?.(itemId, supplierNumId, partNumber);
      }
    }
  };

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
          value={tentativeId}
          onSelect={setTentativeId}
          disablePortal
        />
        {canSaveMapping ? (
          <RememberMappingToggle
            checked={rememberMapping}
            onCheckedChange={setRememberMapping}
            label={
              <>
                Always map{" "}
                <span className="font-mono text-foreground">“{partNumber}”</span> from{" "}
                <span className="font-medium text-foreground">
                  {supplierName || "this supplier"}
                </span>{" "}
                to the part I pick
              </>
            }
          />
        ) : (
          partNumber && (
            <p className="text-xs text-muted-foreground">
              {parsedSupplierName && !supplierResolved
                ? "Resolve the supplier above to enable saving this part-number mapping for next time."
                : null}
            </p>
          )
        )}
      </div>

      <Button
        type="button"
        className="w-full justify-center"
        disabled={!tentativeId}
        onClick={handleConfirm}
      >
        {canSaveMapping && rememberMapping
          ? "Save mapping & continue"
          : "Confirm part"}
      </Button>

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

interface RememberMappingToggleProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: React.ReactNode;
}

function RememberMappingToggle({
  checked,
  onCheckedChange,
  label,
}: RememberMappingToggleProps) {
  return (
    <label className="mt-1 flex cursor-pointer items-start gap-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground hover:bg-muted/60">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <span className="leading-snug">{label}</span>
    </label>
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
