import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { analytics } from "@/lib/analytics";
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
import { useSale, useSaleLines } from "@/hooks/queries";
import { useVoidSale } from "@/hooks/mutations";
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
      analytics.track("sale_voided", {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b pb-6">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
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
  const userName = sale.users
    ? `${sale.users.first_name} ${sale.users.last_name}`.trim()
    : "—";

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
                <p className="text-[13px] font-medium">{sale.date ? new Date(sale.date).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—"}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Sold by</p>
                <p className="text-[13px] font-medium">{userName}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Customer</p>
                <p className="text-[13px] font-medium">{sale.customers?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Channel</p>
                <p className="text-[13px] font-medium">{sale.channels?.name || "—"}</p>
              </div>
              {sale.channel_ref && (
                <div>
                  <p className="text-[13px] text-muted-foreground">Channel Ref</p>
                  <p className="text-[13px] font-medium">{sale.channel_ref}</p>
                </div>
              )}
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
                    <p className="text-[13px] font-medium text-destructive">{sale.voided_at ? new Date(sale.voided_at).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—"}</p>
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
                      key={line.id}
                      className="cursor-pointer"
                      onClick={() => {
                        const itemId = line.items?.id || line.stock?.item_id;
                        if (itemId) {
                          navigate(`/items/${itemId}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">{line.items?.item_id || "—"}</TableCell>
                      <TableCell>{line.locations?.code || "—"}</TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell>{line.unit_price}</TableCell>
                      <TableCell>{line.currencies?.name || "—"}</TableCell>
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
