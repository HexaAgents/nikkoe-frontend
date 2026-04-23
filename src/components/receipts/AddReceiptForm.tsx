import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useCurrencies, useSuppliers, useLocations } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddReceipt } from "@/hooks/mutations";
import type { ReceiptLineInput, Item, Supplier } from "@/types/domain.types";
import type { ParseContext, ParsedLineContext } from "@/types/invoice.types";
import { streamParseInvoice } from "@/lib/api";
import { toast } from "sonner";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { AddLocationModal } from "@/components/modals/AddLocationModal";
import { AddSupplierModal } from "@/components/modals/AddSupplierModal";
import { SearchableSupplierPicker } from "@/components/common/SearchableSupplierPicker";
import { PartLineCard } from "@/components/common/PartLineCard";
import type { PartLine } from "@/components/common/PartLineCard";
import { ResolutionDialog } from "@/components/receipts/ResolutionDialog";
import { cn } from "@/lib/utils";

// Feature flag: flip to `true` to restore the PDF-invoice drop zone on the
// receipts page. All underlying handlers (streamParseInvoice, parse state,
// ResolutionDialog, etc.) remain wired up — only the UI is hidden.
const SHOW_PDF_IMPORT = false;

function getPartLineFieldErrors(part: PartLine): string[] {
  const bad: string[] = [];

  if (!part.item_id?.trim()) bad.push("Part Number");
  if (!part.location_id?.trim()) bad.push("Location");

  if (!part.quantity?.trim()) bad.push("Quantity");
  else {
    const n = Number.parseInt(part.quantity, 10);
    if (!Number.isFinite(n) || n < 1) bad.push("Quantity");
  }

  if (!part.price?.trim()) bad.push("Unit Cost");
  else {
    const raw = part.price.replace(",", ".").trim();
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) bad.push("Unit Cost");
  }

  if (!part.currency_id?.trim()) bad.push("Currency");

  return bad;
}

function partLineToInput(p: PartLine): ReceiptLineInput {
  return {
    item_id: Number(p.item_id) || undefined,
    location_id: Number(p.location_id) || undefined,
    quantity: Number.parseInt(p.quantity, 10),
    unit_price: Number.parseFloat(p.price.replace(",", ".").trim()),
    currency_id: Number(p.currency_id),
  };
}

const emptyPart: PartLine = {
  item_id: "",
  location_id: "",
  quantity: "",
  price: "",
  currency_id: "",
};

export type AddReceiptFormVariant = "inline" | "dialog";

export interface AddReceiptFormProps {
  variant?: AddReceiptFormVariant;
  onSuccessfulCreate?: () => void;
  onCancel?: () => void;
  className?: string;
  defaultItemId?: string;
  defaultItemLabel?: string;
}

export function AddReceiptForm({
  variant = "inline",
  onSuccessfulCreate,
  onCancel,
  className,
  defaultItemId,
  defaultItemLabel,
}: AddReceiptFormProps) {
  const addReceipt = useAddReceipt();
  const [isParsing, setIsParsing] = useState(false);
  const { data: suppliers } = useSuppliers();
  const { data: locations } = useLocations();
  const { data: currencies } = useCurrencies();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supplierId, setSupplierId] = useState<string>("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [parts, setParts] = useState<PartLine[]>([
    defaultItemId ? { ...emptyPart, item_id: defaultItemId } : { ...emptyPart },
  ]);

  // Full parse context from the PDF; `null` before any upload.
  const [parseContext, setParseContext] = useState<ParseContext | null>(null);
  // Labels for matched items — populated from the parse so the part picker
  // displays the correct name without a follow-up fetch.
  const [parsedLabels, setParsedLabels] = useState<Map<string, string>>(new Map());
  // Lets the user dismiss the supplier banner without losing the parse.
  const [supplierBannerDismissed, setSupplierBannerDismissed] = useState(false);
  // Drives the "Parsed N lines" blue info panel visibility.
  const [parseSummaryDismissed, setParseSummaryDismissed] = useState(false);

  const [showErrors, setShowErrors] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const progressTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTicker = useCallback(() => {
    if (progressTickerRef.current) {
      clearInterval(progressTickerRef.current);
      progressTickerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearProgressTicker();
  }, [clearProgressTicker]);

  // Modals
  const [addItemModal, setAddItemModal] = useState<{
    open: boolean;
    defaults?: { part_number?: string; description?: string };
    targetLineIndex: number | null;
  }>({ open: false, targetLineIndex: null });
  const [addSupplierModal, setAddSupplierModal] = useState<{
    open: boolean;
    defaults?: { name?: string };
  }>({ open: false });
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);

  const validation = useMemo(() => {
    const headerErrors: string[] = [];
    if (!supplierId) headerErrors.push("Supplier");
    const errors: { partIndex: number; fields: string[] }[] = [];
    parts.forEach((part, index) => {
      const fields = getPartLineFieldErrors(part);
      if (fields.length > 0) errors.push({ partIndex: index, fields });
    });
    return { isValid: headerErrors.length === 0 && errors.length === 0, headerErrors, errors };
  }, [parts, supplierId]);

  const defaultCurrencyId = currencies?.find((c) => c.name === "GBP")?.id?.toString() ?? "";

  const allLocations = useMemo(
    () => locations?.map((l) => ({ location_id: String(l.id), location_code: l.code })),
    [locations],
  );

  useEffect(() => {
    if (!defaultCurrencyId) return;
    setParts((prev) =>
      prev.map((p) => ({
        ...p,
        currency_id: p.currency_id || defaultCurrencyId,
      }))
    );
  }, [defaultCurrencyId]);

  // --- Parse issue counting -------------------------------------------------

  const unresolvedLineCount = useMemo(() => {
    if (!parseContext) return 0;
    return parseContext.lines.reduce((count, _ctx, idx) => {
      return parts[idx]?.item_id ? count : count + 1;
    }, 0);
  }, [parseContext, parts]);

  const supplierUnresolved = !!parseContext && !supplierId;

  const issueCount = unresolvedLineCount + (supplierUnresolved ? 1 : 0);

  // Auto-open the resolution dialog once parsing finishes with unresolved issues.
  const lastAutoOpenRef = useRef<number>(0);
  useEffect(() => {
    if (isParsing || !parseContext || issueCount === 0) return;
    if (parseContext.createdAt === lastAutoOpenRef.current) return;
    lastAutoOpenRef.current = parseContext.createdAt;
    setResolutionOpen(true);
  }, [isParsing, parseContext, issueCount]);

  // --- PDF upload / streaming parse ----------------------------------------

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") return;
      setIsParsing(true);
      setParseContext(null);
      setParsedLabels(new Map());
      setSupplierBannerDismissed(false);
      setParseSummaryDismissed(false);
      setShowErrors(false);
      setParseProgress(0);

      clearProgressTicker();
      progressTickerRef.current = setInterval(() => {
        setParseProgress((p) => (p >= 65 ? p : p + (65 - p) * 0.03));
      }, 100);

      const labels = new Map<string, string>();
      const accumulatedLines: ParsedLineContext[] = [];
      let totalLines = 0;

      const computeLineProgress = () => {
        if (totalLines <= 0) return 95;
        return 65 + 35 * Math.min(1, accumulatedLines.length / totalLines);
      };
      let header: {
        supplierName: string | null;
        supplierMatched: boolean;
        reference: string | null;
        currencySymbol: string | null;
      } = {
        supplierName: null,
        supplierMatched: false,
        reference: null,
        currencySymbol: null,
      };
      let headerCurrencyId = defaultCurrencyId;

      const emitContext = () => {
        setParseContext({
          supplierName: header.supplierName,
          supplierMatched: header.supplierMatched,
          reference: header.reference,
          currencySymbol: header.currencySymbol,
          lines: [...accumulatedLines],
          createdAt: Date.now(),
        });
      };

      try {
        await streamParseInvoice(file, {
          onHeader: (h) => {
            clearProgressTicker();
            totalLines = h.total_lines ?? 0;
            header = {
              supplierName: h.supplier_name,
              supplierMatched: !!h.matched_supplier_id,
              reference: h.reference,
              currencySymbol: h.currency_symbol,
            };
            if (h.matched_supplier_id) setSupplierId(String(h.matched_supplier_id));
            if (h.reference) setReference(h.reference);
            headerCurrencyId =
              currencies?.find((c) => c.name === h.currency_symbol)?.id?.toString() ??
              defaultCurrencyId;
            setFormKey((k) => k + 1);
            emitContext();
            setParseProgress((p) => Math.max(p, totalLines > 0 ? 65 : 95));
          },

          onLine: (line) => {
            const lineIndex = accumulatedLines.length;
            const ctx: ParsedLineContext = {
              partNumber: line.part_number,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unit_price,
              matchedItemId: line.matched_item_id,
              matchedItemName: line.matched_item_name,
            };
            accumulatedLines.push(ctx);

            if (line.matched_item_id && line.matched_item_name) {
              labels.set(String(line.matched_item_id), line.matched_item_name);
              setParsedLabels(new Map(labels));
            }

            const itemId = line.matched_item_id ? String(line.matched_item_id) : "";
            const newPart: PartLine = {
              item_id: itemId,
              location_id: line.matched_location_id ? String(line.matched_location_id) : "",
              quantity: String(line.quantity),
              price: String(line.unit_price),
              currency_id: headerCurrencyId,
            };

            if (lineIndex === 0) {
              setParts([newPart]);
            } else {
              setParts((prev) => [...prev, newPart]);
            }

            emitContext();
            setParseProgress((p) => Math.max(p, computeLineProgress()));
          },

          onDone: () => {
            clearProgressTicker();
            emitContext();
            setParseProgress(100);
          },

          onError: (msg) => {
            toast.error(`Failed to parse invoice: ${msg}`);
          },
        });
      } catch (err) {
        toast.error(`Failed to parse invoice: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        clearProgressTicker();
        setIsParsing(false);
        window.setTimeout(() => setParseProgress(0), 600);
      }
    },
    [currencies, defaultCurrencyId, clearProgressTicker],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  // --- Form state handlers --------------------------------------------------

  const resetForm = () => {
    setSupplierId("");
    setReference("");
    setNote("");
    setFormKey((k) => k + 1);
    setParts([defaultItemId ? { ...emptyPart, item_id: defaultItemId, currency_id: defaultCurrencyId } : { ...emptyPart, currency_id: defaultCurrencyId }]);
    setShowErrors(false);
    setParseContext(null);
    setParsedLabels(new Map());
    setSupplierBannerDismissed(false);
    setParseSummaryDismissed(false);
    setParseProgress(0);
    clearProgressTicker();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePartSelect = (index: number, itemId: string) => {
    setParts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], item_id: itemId, location_id: "" };
      return updated;
    });
  };

  const handlePartChange = (index: number, field: keyof PartLine, value: string) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  // --- Create-new handlers (open prefilled modals) --------------------------

  const openAddItemForLine = (lineIndex: number, ctx?: ParsedLineContext) => {
    setAddItemModal({
      open: true,
      targetLineIndex: lineIndex,
      defaults: ctx
        ? {
            part_number: ctx.partNumber || undefined,
            description: ctx.description || undefined,
          }
        : undefined,
    });
  };

  const openAddSupplier = (name?: string) => {
    setAddSupplierModal({ open: true, defaults: name ? { name } : undefined });
  };

  const handleItemCreated = (item: Item) => {
    const targetIndex = addItemModal.targetLineIndex;
    // Cache the label so the picker shows the correct name immediately.
    setParsedLabels((prev) => {
      const next = new Map(prev);
      next.set(String(item.id), item.item_id);
      return next;
    });
    if (targetIndex != null) {
      handlePartSelect(targetIndex, String(item.id));
    }
  };

  const handleSupplierCreated = (supplier: Supplier) => {
    setSupplierId(String(supplier.id));
  };

  // --- Submit ---------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;

    const lines: ReceiptLineInput[] = parts.map((p) => partLineToInput(p));

    await addReceipt.mutateAsync({
      receipt: {
        supplier_id: Number(supplierId) || undefined,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      },
      lines,
    });

    analytics.track("receipt_created", {
      line_count: lines.length,
      has_supplier: !!supplierId,
      has_reference: !!reference.trim(),
    });

    resetForm();
    onSuccessfulCreate?.();
  };

  const handleCancelOrClear = () => {
    resetForm();
    if (variant === "dialog") onCancel?.();
  };

  const getPartErrors = (index: number) =>
    validation.errors.find((e) => e.partIndex === index)?.fields || [];

  // --- Render ---------------------------------------------------------------

  return (
    <>
      <form onSubmit={handleSubmit} className={cn(className)}>
        <div className={cn("space-y-6", variant === "inline" ? "py-0" : "py-4")}>
          {/* PDF upload zone -- hidden behind SHOW_PDF_IMPORT feature flag. */}
          {SHOW_PDF_IMPORT && (
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border-2 border-dashed p-4 text-center transition-colors",
              isParsing
                ? "border-green-500/60 bg-green-50/30 dark:bg-green-950/20"
                : isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              isParsing && "pointer-events-none",
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 bg-green-500/25 transition-[width] duration-200 ease-out dark:bg-green-500/30"
              style={{ width: isParsing || parseProgress > 0 ? `${parseProgress}%` : "0%" }}
              aria-hidden="true"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            {isParsing ? (
              <div className="relative flex items-center justify-center gap-2 py-2">
                <Loader2 className="h-5 w-5 animate-spin text-green-700 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  Parsing invoice… {Math.round(parseProgress)}%
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="relative flex w-full items-center justify-center gap-2 py-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Drop a PDF invoice here, or <span className="font-medium text-primary underline">browse</span>
                </span>
              </button>
            )}
          </div>
          )}

          {/* Parse summary + Resolve chip */}
          {parseContext && !parseSummaryDismissed && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-muted-foreground/20 bg-muted/50 p-3 dark:border-muted-foreground/30 dark:bg-muted/30">
              <div className="flex-1 text-sm text-foreground/80">
                Parsed {parseContext.lines.length} line item
                {parseContext.lines.length !== 1 ? "s" : ""} from invoice.
                {issueCount > 0 && (
                  <span className="ml-1 text-amber-700 dark:text-amber-400">
                    {issueCount} {issueCount === 1 ? "issue needs" : "issues need"} attention.
                  </span>
                )}
              </div>
              {issueCount > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setResolutionOpen(true)}
                >
                  Resolve {issueCount} {issueCount === 1 ? "issue" : "issues"}
                </Button>
              )}
              <button
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setParseSummaryDismissed(true)}
                aria-label="Dismiss parse summary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Unmatched supplier banner */}
          {supplierUnresolved && !supplierBannerDismissed && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="flex-1 text-amber-900 dark:text-amber-100">
                {parseContext?.supplierName ? (
                  <>
                    Supplier{" "}
                    <span className="font-medium">“{parseContext.supplierName}”</span>{" "}
                    from the invoice is not in your database.
                  </>
                ) : (
                  "No supplier was detected in the invoice."
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => openAddSupplier(parseContext?.supplierName || undefined)}
              >
                {parseContext?.supplierName ? "Create supplier" : "Add supplier"}
              </Button>
              <button
                type="button"
                className="shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
                onClick={() => setSupplierBannerDismissed(true)}
                aria-label="Dismiss supplier banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {showErrors && validation.headerErrors.length > 0 && (
            <p className="text-sm text-destructive">Missing: {validation.headerErrors.join(", ")}</p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Label className={`w-24 shrink-0 ${showErrors && !supplierId ? "text-destructive" : "text-muted-foreground"}`}>Supplier:</Label>
            <SearchableSupplierPicker
              key={`supplier-${formKey}`}
              suppliers={suppliers}
              value={supplierId}
              onSelect={setSupplierId}
              hasError={showErrors && !supplierId}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => openAddSupplier(parseContext?.supplierName || undefined)}
            >
              New Supplier
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0 text-muted-foreground">Reference:</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="min-w-0 flex-1"
              placeholder="PO, ASN, or other reference (optional)"
            />
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <Label className="w-24 shrink-0 pt-2 text-muted-foreground">Note:</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px] min-w-0 flex-1"
            />
          </div>

          {parts.map((part, index) => {
            const invoiceContext = parseContext?.lines[index];
            return (
              <PartLineCard
                key={index}
                index={index}
                part={part}
                locations={allLocations}
                currencies={currencies}
                priceLabel="Unit Cost"
                showAvailableStock={false}
                showErrors={showErrors}
                errors={getPartErrors(index)}
                canRemove={parts.length > 1}
                onPartSelect={handlePartSelect}
                onFieldChange={handlePartChange}
                onRemove={(i) => setParts(parts.filter((_, j) => j !== i))}
                partLabel={parsedLabels.get(part.item_id) || (index === 0 && defaultItemLabel ? defaultItemLabel : undefined)}
                invoiceContext={invoiceContext}
                invoiceCurrencySymbol={parseContext?.currencySymbol}
                onCreatePartFromInvoice={(i, ctx) => openAddItemForLine(i, ctx)}
                extraPartActions={
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => openAddItemForLine(index, invoiceContext)}
                  >
                    New Part
                  </Button>
                }
                extraLocationActions={
                  <Button type="button" variant="secondary" onClick={() => setIsAddLocationModalOpen(true)}>
                    New Location
                  </Button>
                }
              />
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-6">
          <Button type="submit" disabled={addReceipt.isPending}>
            {addReceipt.isPending ? "Creating..." : variant === "inline" ? "Create receipt" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setParts([...parts, { ...emptyPart, currency_id: defaultCurrencyId }])}>
            Add Part
          </Button>
          {variant === "inline" ? (
            <Button type="button" variant="outline" onClick={handleCancelOrClear}>
              Clear form
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={handleCancelOrClear}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <AddItemModal
        open={addItemModal.open}
        onOpenChange={(open) => setAddItemModal((prev) => ({ ...prev, open }))}
        defaults={addItemModal.defaults}
        onCreated={handleItemCreated}
      />
      <AddLocationModal open={isAddLocationModalOpen} onOpenChange={setIsAddLocationModalOpen} />
      <AddSupplierModal
        open={addSupplierModal.open}
        onOpenChange={(open) => setAddSupplierModal((prev) => ({ ...prev, open }))}
        defaults={addSupplierModal.defaults}
        onCreated={handleSupplierCreated}
      />
      <ResolutionDialog
        open={resolutionOpen}
        onOpenChange={setResolutionOpen}
        parseContext={parseContext}
        supplierId={supplierId}
        parts={parts}
        onSelectSupplier={(id) => setSupplierId(id)}
        onSelectPart={(lineIndex, itemId) => handlePartSelect(lineIndex, itemId)}
        onCreateSupplier={(name) => {
          setResolutionOpen(false);
          openAddSupplier(name);
        }}
        onCreatePart={(lineIndex, ctx) => {
          setResolutionOpen(false);
          openAddItemForLine(lineIndex, ctx);
        }}
      />
    </>
  );
}
