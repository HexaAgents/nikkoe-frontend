import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react";
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
import { toast } from "sonner";

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const itemId = parseInt(id || "0");
  
  const { data: item, isLoading } = useItem(itemId);
  const { data: categories } = useCategories();
  const { data: supplierQuotes } = useItemSupplierQuotes(itemId);
  const { data: inventory } = useItemInventory(itemId);
  const { data: receipts } = useItemReceipts(itemId);
  const { data: sales } = useItemSales(itemId);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const deleteQuote = useDeleteSupplierQuote();

  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);

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
            <h1 className="font-display text-[28px] font-normal text-foreground">{item.part_number}</h1>
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
            <div className="grid gap-6 md:grid-cols-2">
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
                        <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-[13px]">{item.categories?.name || "-"}</p>
                )}
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
                      <TableRow key={quote.quote_id}>
                        <TableCell>{new Date(quote.quoted_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{quote.suppliers?.supplier_name}</TableCell>
                        <TableCell>{quote.unit_cost}</TableCell>
                        <TableCell>{quote.currency}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteQuote(quote.quote_id)}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No inventory records
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory?.map((inv) => (
                      <TableRow key={`${inv.item_id}-${inv.location_id}`}>
                        <TableCell>{inv.locations?.location_code}</TableCell>
                        <TableCell>{inv.quantity_on_hand}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="border-b pb-6">
              <CardTitle>Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No sales
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales?.map((sale) => (
                      <TableRow 
                        key={sale.sale_line_id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/sales/${sale.sales?.sale_id}`)}
                      >
                        <TableCell>{sale.sales?.sale_id}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell className="font-medium">{sale.locations?.location_code}</TableCell>
                        <TableCell>{sale.unit_price}</TableCell>
                        <TableCell>{sale.currency}</TableCell>
                        <TableCell>{new Date(sale.sales?.sold_at || "").toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-6">
              <CardTitle>Receipts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No receipts
                      </TableCell>
                    </TableRow>
                  ) : (
                    receipts?.map((receipt) => (
                      <TableRow 
                        key={receipt.receipt_line_id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/receipts/${receipt.receipts?.receipt_id}`)}
                      >
                        <TableCell>{receipt.receipts?.receipt_id}</TableCell>
                        <TableCell>{receipt.quantity}</TableCell>
                        <TableCell className="font-medium">{receipt.receipts?.suppliers?.supplier_name}</TableCell>
                        <TableCell>{receipt.unit_cost}</TableCell>
                        <TableCell>{receipt.currency}</TableCell>
                        <TableCell>{new Date(receipt.receipts?.received_at || "").toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      <AddSupplierQuoteModal
        open={isAddQuoteModalOpen}
        onOpenChange={setIsAddQuoteModalOpen}
        itemId={itemId}
      />
    </MainLayout>
  );
}
