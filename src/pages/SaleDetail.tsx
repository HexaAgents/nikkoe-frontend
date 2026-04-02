import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { useSale, useSaleLines, useVoidSale } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const saleId = id || "";
  const [voidReason, setVoidReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: sale, isLoading } = useSale(saleId);
  const { data: saleLines } = useSaleLines(saleId);
  const voidSale = useVoidSale();

  const handleVoid = async () => {
    if (!user?.id) return;
    
    try {
      await voidSale.mutateAsync({
        saleId,
        voidedBy: user.id,
        reason: voidReason || undefined,
      });
      posthog.capture("sale_voided", {
        sale_id: saleId,
        has_reason: !!voidReason,
      });
      setIsDialogOpen(false);
      setVoidReason("");
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

  if (!sale) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">Sale not found</p>
          <Button onClick={() => navigate("/sales")}>Back to Sales</Button>
        </div>
      </MainLayout>
    );
  }

  const isVoided = sale.status === "VOIDED";

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate("/sales")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-[28px] font-normal text-foreground">Sale</h1>
            <Badge variant={isVoided ? "destructive" : "default"}>
              {sale.status}
            </Badge>
          </div>
          {!isVoided && (
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Void Sale</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Void this sale?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reverse the inventory movements and mark the sale as voided. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Reason for voiding (optional)"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleVoid} disabled={voidSale.isPending}>
                    {voidSale.isPending ? "Voiding..." : "Void Sale"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <p className="text-[13px] text-muted-foreground">Date and Time</p>
                <p className="text-[13px] font-medium">{new Date(sale.sold_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Customer</p>
                <p className="text-[13px] font-medium">{sale.customer_name || "—"}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Channel</p>
                <p className="text-[13px] font-medium">{sale.channels?.channel_name || "—"}</p>
              </div>
              {sale.note && (
                <div className="sm:col-span-2">
                  <p className="text-[13px] text-muted-foreground">Note</p>
                  <p className="text-[13px] font-medium whitespace-pre-wrap">{sale.note}</p>
                </div>
              )}
              {isVoided && (
                <>
                  <div>
                    <p className="text-[13px] text-muted-foreground">Voided At</p>
                    <p className="text-[13px] font-medium text-destructive">{new Date(sale.voided_at).toLocaleString()}</p>
                  </div>
                  {sale.void_reason && (
                    <div>
                      <p className="text-[13px] text-muted-foreground">Void Reason</p>
                      <p className="text-[13px] font-medium text-destructive">{sale.void_reason}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-6">
            <CardTitle>Sale Lines</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleLines?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No sale lines
                    </TableCell>
                  </TableRow>
                ) : (
                  saleLines?.map((line) => (
                    <TableRow 
                      key={line.sale_line_id}
                      className="cursor-pointer"
                      onClick={() => {
                        if (line.item_id) {
                          navigate(`/items/${line.item_id}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">{(line as any).items?.part_number || "—"}</TableCell>
                      <TableCell>{(line as any).locations?.location_code || "—"}</TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell>{line.unit_price}</TableCell>
                      <TableCell>{line.currency_code || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
