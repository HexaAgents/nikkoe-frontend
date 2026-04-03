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
import { useReceipt, useReceiptLines } from "@/hooks/queries";
import { useVoidReceipt } from "@/hooks/mutations";
import { useAuth } from "@/contexts/AuthContext";

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const receiptId = id || "";
  const [voidReason, setVoidReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: receipt, isLoading } = useReceipt(receiptId);
  const { data: receiptLines } = useReceiptLines(receiptId);
  const voidReceipt = useVoidReceipt();

  const handleVoid = async () => {
    if (!user?.id) return;
    
    try {
      await voidReceipt.mutateAsync({
        receiptId,
        voidedBy: user.id,
        reason: voidReason || undefined,
      });
      analytics.track("receipt_voided", {
        receipt_id: receiptId,
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

  if (!receipt) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">Receipt not found</p>
          <Button onClick={() => navigate("/receipts")}>Back to Receipts</Button>
        </div>
      </MainLayout>
    );
  }

  const isVoided = receipt.status === "VOIDED";

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate("/receipts")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-[28px] font-normal text-foreground">Receipt No. {receipt.receipt_id}</h1>
            <Badge variant={isVoided ? "destructive" : "default"}>
              {receipt.status}
            </Badge>
          </div>
          {!isVoided && (
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Void Receipt</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Void this receipt?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reverse the inventory movements and mark the receipt as voided. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Reason for voiding (optional)"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleVoid} disabled={voidReceipt.isPending}>
                    {voidReceipt.isPending ? "Voiding..." : "Void Receipt"}
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
                <p className="text-[13px] font-medium">{new Date(receipt.received_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Received by</p>
                <p className="text-[13px] font-medium">{receipt.users?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Supplier</p>
                <p className="text-[13px] font-medium">{receipt.suppliers?.supplier_name || "—"}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Reference</p>
                <p className="text-[13px] font-medium">{receipt.reference?.trim() || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[13px] text-muted-foreground">Note</p>
                <p className="text-[13px] font-medium whitespace-pre-wrap">{receipt.note?.trim() || "—"}</p>
              </div>
              {isVoided && (
                <>
                  <div>
                    <p className="text-[13px] text-muted-foreground">Voided At</p>
                    <p className="text-[13px] font-medium text-destructive">{new Date(receipt.voided_at).toLocaleString()}</p>
                  </div>
                  {receipt.void_reason && (
                    <div>
                      <p className="text-[13px] text-muted-foreground">Void Reason</p>
                      <p className="text-[13px] font-medium text-destructive">{receipt.void_reason}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-6">
            <CardTitle>Receipt Lines</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptLines?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No receipt lines
                    </TableCell>
                  </TableRow>
                ) : (
                  receiptLines?.map((line) => (
                    <TableRow 
                      key={line.receipt_line_id}
                      className="cursor-pointer"
                      onClick={() => {
                        if (line.item_id) {
                          navigate(`/items/${line.item_id}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">{line.items?.part_number}</TableCell>
                      <TableCell>{line.locations?.location_code}</TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell>{line.unit_cost}</TableCell>
                      <TableCell>{line.currency}</TableCell>
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
