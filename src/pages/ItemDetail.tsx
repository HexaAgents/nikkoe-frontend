import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Plus, ArrowRightLeft, ChevronDown, ChevronUp, AlertTriangle, ShoppingCart, PackagePlus } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TableCardSkeleton } from "@/components/common/PageLoadingScreen";
import { useItem, useItemSupplierQuotes, useItemInventory, useItemReceipts, useItemSales, useItemTransfers, useCategories } from "@/hooks/queries";
import { useUpdateItem, useDeleteItem, useDeleteSupplierQuote } from "@/hooks/mutations";
import { AddSupplierQuoteModal } from "@/components/modals/AddSupplierQuoteModal";
import { TransferStockModal } from "@/components/modals/TransferStockModal";
import { AddSaleModal } from "@/components/modals/AddSaleModal";
import { AddReceiptModal } from "@/components/modals/AddReceiptModal";
import { toast } from "sonner";
import { summarizeInventory } from "@/lib/inventory-summary";
import type { ItemReceiptHistory, ItemSaleHistory, ItemTransferHistory, StockWithLocation } from "@/types/domain.types";

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const itemId = parseInt(id || "0");
  
  const { data: item, isLoading } = useItem(itemId);
  const { data: categories } = useCategories();
  const { data: supplierQuotes } = useItemSupplierQuotes(itemId);
  const { data: inventory } = useItemInventory(itemId);
  const { data: receiptsHistory, isLoading: isReceiptsLoading } = useItemReceipts(itemId);
  const { data: salesHistory, isLoading: isSalesLoading } = useItemSales(itemId);
  const { data: transfersHistory, isLoading: isTransfersLoading } = useItemTransfers(itemId);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const deleteQuote = useDeleteSupplierQuote();

  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [transferStock, setTransferStock] = useState<StockWithLocation | null>(null);
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const [showAllSales, setShowAllSales] = useState(false);
  const [showAllTransfers, setShowAllTransfers] = useState(false);

  const PREVIEW_ROWS = 5;

  const inventorySummary = summarizeInventory(inventory);
  const { total: inventoryTotal, negativeOffset: inventoryNegativeTotal, hasNegative: hasNegativeStock, visible: visibleInventory } = inventorySummary;

  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    await deleteQuote.mutateAsync({ quoteId, itemId });
  };

  useEffect(() => {
    if (item) {
      setDescription(item.description || "");
      setCategoryId(item.category_id?.toString() || "");
    }
  }, [item]);

  const handleSave = async () => {
    try {
      await updateItem.mutateAsync({
        itemId,
        updates: {
          description: description || undefined,
          category_id: categoryId ? parseInt(categoryId) : undefined,
        },
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      await deleteItem.mutateAsync(itemId);
      navigate("/items");
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6 px-1 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-8 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="border-b pb-6">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!item) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">Item not found</p>
          <Button onClick={() => navigate("/items")}>Back to Items</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-[28px] font-normal text-foreground">{item.item_id}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsSaleModalOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsReceiptModalOpen(true)}>
              <PackagePlus className="mr-2 h-4 w-4" />
              New Receipt
            </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Item
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {item.item_id}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this item and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                {isEditing ? (
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                ) : (
                  <p className="text-[13px]">{item.description || "-"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                {isEditing ? (
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-[13px]">{item.categories?.name || "-"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Total Quantity</Label>
                <p className="text-[13px]">{inventory ? inventoryTotal : "-"}</p>
                {hasNegativeStock && (
                  <p
                    className="flex items-start gap-1 text-[12px] text-destructive"
                    title="At least one location holds negative stock. This usually means a sale was recorded against a location that had no on-hand (often via the eBay sync). The negative rows are highlighted in the Locations panel and need reconciliation."
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Stock issue: {inventoryNegativeTotal} unit{inventoryNegativeTotal === 1 ? "" : "s"} are in
                      negative location rows, usually from a historical sale logged against the wrong location.
                    </span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Supplier Price</Label>
                {supplierQuotes && supplierQuotes.length > 0 ? (
                  <div className="text-[13px]">
                    <span className="font-medium">{supplierQuotes[0].cost.toFixed(3)}</span>
                    {" "}
                    <span className="text-muted-foreground">{supplierQuotes[0].currency?.name ?? ""}</span>
                    <span className="text-muted-foreground"> from {supplierQuotes[0].supplier?.name ?? "Unknown"}</span>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">No quotes</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={updateItem.isPending}>
                    {updateItem.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Item
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
              <div className="flex items-center gap-3">
                <CardTitle>Supplier Quotes</CardTitle>
                {supplierQuotes && supplierQuotes.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {supplierQuotes.length} quote{supplierQuotes.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <Button size="sm" onClick={() => setIsAddQuoteModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Quote
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!supplierQuotes || supplierQuotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No supplier quotes
                      </TableCell>
                    </TableRow>
                  ) : (
                    (showAllQuotes ? supplierQuotes : supplierQuotes.slice(0, PREVIEW_ROWS)).map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>{quote.date_time ? new Date(quote.date_time).toLocaleDateString("en-GB", { timeZone: "Europe/London" }) : "-"}</TableCell>
                        <TableCell className="font-medium">{quote.supplier?.name ?? "-"}</TableCell>
                        <TableCell>{quote.cost}</TableCell>
                        <TableCell>{quote.currency?.name ?? "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteQuote(quote.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {supplierQuotes && supplierQuotes.length > PREVIEW_ROWS && (
                <div className="border-t px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setShowAllQuotes(!showAllQuotes)}
                  >
                    {showAllQuotes ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        See all {supplierQuotes.length} quotes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-6">
              <CardTitle>Locations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No inventory records
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleInventory.map((inv) => {
                      const isNegative = (inv.quantity ?? 0) < 0;
                      return (
                        <TableRow key={`${inv.item_id}-${inv.location_id}`} className={isNegative ? "bg-destructive/5" : undefined}>
                          <TableCell className={isNegative ? "text-destructive" : undefined}>
                            {isNegative && (
                              <AlertTriangle
                                className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom"
                                aria-label="Negative on-hand"
                              />
                            )}
                            {inv.location?.code ?? "-"}
                          </TableCell>
                          <TableCell
                            className={isNegative ? "font-medium text-destructive" : undefined}
                            title={isNegative ? "Negative on-hand: this location was sold from when it had no stock (often the eBay sync). Reconcile by transferring in stock or correcting the source records." : undefined}
                          >
                            {inv.quantity}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={(inv.quantity ?? 0) <= 0}
                              onClick={() => setTransferStock(inv)}
                              title={isNegative ? "Cannot transfer from a negative-stock location" : "Transfer stock"}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b pb-6">
            <div className="flex items-center justify-between">
              <CardTitle>Receipt History</CardTitle>
              {receiptsHistory && receiptsHistory.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {receiptsHistory.length} receipt{receiptsHistory.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isReceiptsLoading ? (
              <div className="p-4">
                <TableCardSkeleton rows={3} columns={5} />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!receiptsHistory || receiptsHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          No receipts recorded for this item
                        </TableCell>
                      </TableRow>
                    ) : (
                      (showAllReceipts ? receiptsHistory : receiptsHistory.slice(0, PREVIEW_ROWS)).map((receipt: ItemReceiptHistory) => {
                        const unitCost = receipt.unit_price ?? 0;
                        const total = unitCost * (receipt.quantity ?? 0);
                        const isVoided = receipt.status === "VOIDED";
                        return (
                          <TableRow
                            key={receipt.id}
                            className={`${isVoided ? "text-muted-foreground line-through" : ""} cursor-pointer`}
                            onClick={() => navigate(`/receipts/${receipt.receipt_id}`)}
                          >
                            <TableCell className="whitespace-nowrap">
                              {receipt.date ? new Date(receipt.date).toLocaleDateString("en-GB", { timeZone: "Europe/London" }) : "-"}
                            </TableCell>
                            <TableCell>{receipt.suppliers?.name ?? "-"}</TableCell>
                            <TableCell>{receipt.reference ?? "-"}</TableCell>
                            <TableCell className="text-right tabular-nums">{receipt.quantity ?? 0}</TableCell>
                            <TableCell className="text-right tabular-nums">{unitCost.toFixed(3)}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">{total.toFixed(3)}</TableCell>
                            <TableCell>{receipt.currencies?.name ?? "-"}</TableCell>
                            <TableCell>{receipt.locations?.code ?? "-"}</TableCell>
                            <TableCell>
                              {receipt.users
                                ? `${receipt.users.first_name} ${receipt.users.last_name}`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {isVoided ? (
                                <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                  Voided
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                                  Completed
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                {receiptsHistory && receiptsHistory.length > PREVIEW_ROWS && (
                  <div className="border-t px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => setShowAllReceipts(!showAllReceipts)}
                    >
                      {showAllReceipts ? (
                        <>
                          <ChevronUp className="mr-2 h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-2 h-4 w-4" />
                          See all {receiptsHistory.length} receipts
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-6">
            <div className="flex items-center justify-between">
              <CardTitle>Sales History</CardTitle>
              {salesHistory && salesHistory.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {salesHistory.length} sale{salesHistory.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isSalesLoading ? (
              <div className="p-4">
                <TableCardSkeleton rows={3} columns={5} />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Sold By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!salesHistory || salesHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          No sales recorded for this item
                        </TableCell>
                      </TableRow>
                    ) : (
                      (showAllSales ? salesHistory : salesHistory.slice(0, PREVIEW_ROWS)).map((sale: ItemSaleHistory) => {
                        const unitPrice = parseFloat(sale.unit_price) || 0;
                        const total = unitPrice * (sale.quantity ?? 0);
                        const isVoided = sale.status === "VOIDED";
                        return (
                          <TableRow
                            key={sale.id}
                            className={`${isVoided ? "text-muted-foreground line-through" : ""} cursor-pointer`}
                            onClick={() => navigate(`/sales/${sale.sale_id}`)}
                          >
                            <TableCell className="whitespace-nowrap">
                              {sale.date ? new Date(sale.date).toLocaleDateString("en-GB", { timeZone: "Europe/London" }) : "-"}
                            </TableCell>
                            <TableCell>{sale.customers?.name ?? "-"}</TableCell>
                            <TableCell>{sale.channels?.name ?? "-"}</TableCell>
                            <TableCell className="text-right tabular-nums">{sale.quantity ?? 0}</TableCell>
                            <TableCell className="text-right tabular-nums">{unitPrice.toFixed(3)}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">{total.toFixed(3)}</TableCell>
                            <TableCell>{sale.currencies?.name ?? "-"}</TableCell>
                            <TableCell>{sale.locations?.code ?? "-"}</TableCell>
                            <TableCell>
                              {sale.users
                                ? `${sale.users.first_name} ${sale.users.last_name}`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {isVoided ? (
                                <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                  Voided
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                                  Completed
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                {salesHistory && salesHistory.length > PREVIEW_ROWS && (
                  <div className="border-t px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => setShowAllSales(!showAllSales)}
                    >
                      {showAllSales ? (
                        <>
                          <ChevronUp className="mr-2 h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-2 h-4 w-4" />
                          See all {salesHistory.length} sales
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-6">
            <div className="flex items-center justify-between">
              <CardTitle>Stock Movements</CardTitle>
              {transfersHistory && transfersHistory.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {transfersHistory.length} transfer{transfersHistory.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isTransfersLoading ? (
              <div className="p-4">
                <TableCardSkeleton rows={3} columns={5} />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From Item</TableHead>
                      <TableHead>To Item</TableHead>
                      <TableHead>From Location</TableHead>
                      <TableHead>To Location</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!transfersHistory || transfersHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No stock movements for this item
                        </TableCell>
                      </TableRow>
                    ) : (
                      (showAllTransfers ? transfersHistory : transfersHistory.slice(0, PREVIEW_ROWS)).map((transfer: ItemTransferHistory) => (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">{transfer.from_item?.item_id ?? "-"}</TableCell>
                          <TableCell className="font-medium">{transfer.to_item?.item_id ?? "-"}</TableCell>
                          <TableCell>{transfer.from_location?.code ?? "-"}</TableCell>
                          <TableCell>{transfer.to_location?.code ?? "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {transfer.date ? new Date(transfer.date).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {transfersHistory && transfersHistory.length > PREVIEW_ROWS && (
                  <div className="border-t px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => setShowAllTransfers(!showAllTransfers)}
                    >
                      {showAllTransfers ? (
                        <>
                          <ChevronUp className="mr-2 h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-2 h-4 w-4" />
                          See all {transfersHistory.length} transfers
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </div>
      <AddSupplierQuoteModal
        open={isAddQuoteModalOpen}
        onOpenChange={setIsAddQuoteModalOpen}
        itemId={itemId}
        latestQuote={supplierQuotes?.[0]}
      />
      {transferStock && (
        <TransferStockModal
          open={!!transferStock}
          onOpenChange={(open) => { if (!open) setTransferStock(null); }}
          itemPartNumber={item.item_id}
          fromStock={transferStock}
        />
      )}
      <AddSaleModal
        open={isSaleModalOpen}
        onOpenChange={setIsSaleModalOpen}
        defaultItemId={String(item.id)}
        defaultItemLabel={item.item_id}
      />
      <AddReceiptModal
        open={isReceiptModalOpen}
        onOpenChange={setIsReceiptModalOpen}
        defaultItemId={String(item.id)}
        defaultItemLabel={item.item_id}
      />
    </MainLayout>
  );
}
