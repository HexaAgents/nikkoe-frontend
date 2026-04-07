import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Plus, ArrowRightLeft, ChevronDown, ChevronUp } from "lucide-react";
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
import { useItem, useItemSupplierQuotes, useItemInventory, useItemReceipts, useItemSales, useCategories } from "@/hooks/queries";
import { useUpdateItem, useDeleteItem, useDeleteSupplierQuote } from "@/hooks/mutations";
import { AddSupplierQuoteModal } from "@/components/modals/AddSupplierQuoteModal";
import { TransferStockModal } from "@/components/modals/TransferStockModal";
import { toast } from "sonner";
import type { ItemReceiptHistory, ItemSaleHistory, StockWithLocation } from "@/types/domain.types";

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
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const deleteQuote = useDeleteSupplierQuote();

  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);
  const [transferStock, setTransferStock] = useState<StockWithLocation | null>(null);
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const [showAllSales, setShowAllSales] = useState(false);

  const PREVIEW_ROWS = 5;

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
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[300px] w-full" />
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
          <div className="flex gap-2">
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              Delete Item
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-6 md:grid-cols-3">
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
                <p className="text-[13px]">
                  {inventory?.reduce((sum, inv) => sum + (inv.quantity ?? 0), 0) ?? "-"}
                </p>
              </div>
            </div>
            {isEditing && (
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={updateItem.isPending}>
                  {updateItem.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
              <CardTitle>Supplier Quotes</CardTitle>
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
                  {supplierQuotes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No supplier quotes
                      </TableCell>
                    </TableRow>
                  ) : (
                    supplierQuotes?.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>{quote.date_time ? new Date(quote.date_time).toLocaleDateString() : "-"}</TableCell>
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
                  {inventory?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No inventory records
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory?.map((inv) => (
                      <TableRow key={`${inv.item_id}-${inv.location_id}`}>
                        <TableCell>{inv.location?.code ?? "-"}</TableCell>
                        <TableCell>{inv.quantity}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={inv.quantity <= 0}
                            onClick={() => setTransferStock(inv)}
                            title="Transfer stock"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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
              <div className="p-6">
                <Skeleton className="h-[120px] w-full" />
              </div>
            ) : (
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
                            {receipt.date ? new Date(receipt.date).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>{receipt.suppliers?.name ?? "-"}</TableCell>
                          <TableCell>{receipt.reference ?? "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">{receipt.quantity ?? 0}</TableCell>
                          <TableCell className="text-right tabular-nums">{unitCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{total.toFixed(2)}</TableCell>
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
              <div className="p-6">
                <Skeleton className="h-[120px] w-full" />
              </div>
            ) : (
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
                            {sale.date ? new Date(sale.date).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>{sale.customers?.name ?? "-"}</TableCell>
                          <TableCell>{sale.channels?.name ?? "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">{sale.quantity ?? 0}</TableCell>
                          <TableCell className="text-right tabular-nums">{unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{total.toFixed(2)}</TableCell>
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
            )}
          </CardContent>
        </Card>

      </div>
      <AddSupplierQuoteModal
        open={isAddQuoteModalOpen}
        onOpenChange={setIsAddQuoteModalOpen}
        itemId={itemId}
      />
      {transferStock && (
        <TransferStockModal
          open={!!transferStock}
          onOpenChange={(open) => { if (!open) setTransferStock(null); }}
          itemPartNumber={item.item_id}
          fromStock={transferStock}
        />
      )}
    </MainLayout>
  );
}
