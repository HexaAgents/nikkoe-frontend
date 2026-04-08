import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Mail, Phone, MapPin } from "lucide-react";
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
import { TableCardSkeleton } from "@/components/common/PageLoadingScreen";
import { useSupplier, useSupplierReceipts } from "@/hooks/queries";
import type { SupplierReceiptHistory } from "@/types/domain.types";

const PREVIEW_ROWS = 5;

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const supplierId = id || "";

  const { data: supplier, isLoading } = useSupplier(supplierId);
  const { data: receipts, isLoading: isReceiptsLoading } = useSupplierReceipts(supplierId);
  const [showAllReceipts, setShowAllReceipts] = useState(false);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6 px-1 pt-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b pb-6">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!supplier) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">Supplier not found</p>
          <Button onClick={() => navigate("/settings")}>Back to Settings</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-[28px] font-normal text-foreground">{supplier.name}</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {supplier.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[13px] text-muted-foreground">Address</p>
                    <p className="text-[13px] font-medium">{supplier.address}</p>
                  </div>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[13px] text-muted-foreground">Email</p>
                    <p className="text-[13px] font-medium">{supplier.email}</p>
                  </div>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[13px] text-muted-foreground">Phone</p>
                    <p className="text-[13px] font-medium">{supplier.phone}</p>
                  </div>
                </div>
              )}
              {!supplier.address && !supplier.email && !supplier.phone && (
                <p className="text-[13px] text-muted-foreground">No contact information on file</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-6">
            <div className="flex items-center justify-between">
              <CardTitle>Receipt History</CardTitle>
              {receipts && receipts.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
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
                      <TableHead>Receipt No.</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!receipts || receipts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                          No receipts recorded for this supplier
                        </TableCell>
                      </TableRow>
                    ) : (
                      (showAllReceipts ? receipts : receipts.slice(0, PREVIEW_ROWS)).map(
                        (line: SupplierReceiptHistory) => {
                          const unitCost = line.unit_price ?? 0;
                          const total = unitCost * (line.quantity ?? 0);
                          const isVoided = line.status === "VOIDED";
                          return (
                            <TableRow
                              key={line.id}
                              className={`${isVoided ? "text-muted-foreground line-through" : ""} cursor-pointer`}
                              onClick={() => navigate(`/receipts/${line.receipt_id}`)}
                            >
                              <TableCell className="whitespace-nowrap">
                                {line.date ? new Date(line.date).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell className="tabular-nums">{line.receipt_id}</TableCell>
                              <TableCell className="font-medium">
                                {line.items?.item_id ?? "-"}
                              </TableCell>
                              <TableCell>{line.locations?.code ?? "-"}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {line.quantity ?? 0}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {unitCost.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums font-medium">
                                {total.toFixed(2)}
                              </TableCell>
                              <TableCell>{line.currencies?.name ?? "-"}</TableCell>
                              <TableCell>{line.reference ?? "-"}</TableCell>
                              <TableCell>
                                {line.users
                                  ? `${line.users.first_name} ${line.users.last_name}`
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
                        }
                      )
                    )}
                  </TableBody>
                </Table>
                {receipts && receipts.length > PREVIEW_ROWS && (
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
                          See all {receipts.length} receipts
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
    </MainLayout>
  );
}
