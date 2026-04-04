import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchablePartPicker } from "@/components/common/SearchablePartPicker";
import { SearchableLocationPicker } from "@/components/common/SearchableLocationPicker";

export interface PartLine {
  item_id: string;
  location_id: string;
  quantity: string;
  price: string;
  currency_code: string;
}

interface PartLineCardProps {
  index: number;
  part: PartLine;
  items: { item_id: string | number; part_number: string }[] | undefined;
  locations: { location_id: string | number; location_code: string }[] | undefined;
  priceLabel: string;
  showErrors: boolean;
  errors: string[];
  canRemove: boolean;
  onPartSelect: (index: number, itemId: string) => void;
  onFieldChange: (index: number, field: keyof PartLine, value: string) => void;
  onRemove: (index: number) => void;
  extraPartActions?: React.ReactNode;
  extraLocationActions?: React.ReactNode;
}

export function PartLineCard({
  index,
  part,
  items,
  locations,
  priceLabel,
  showErrors,
  errors,
  canRemove,
  onPartSelect,
  onFieldChange,
  onRemove,
  extraPartActions,
  extraLocationActions,
}: PartLineCardProps) {
  return (
    <Card className={`border-primary/20 ${showErrors && errors.length > 0 ? "border-destructive" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-foreground">Part {index + 1}</CardTitle>
          {canRemove && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
        {showErrors && errors.length > 0 && (
          <p className="mt-1 text-xs text-destructive">Missing: {errors.join(", ")}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Label
            className={`w-32 shrink-0 ${showErrors && errors.includes("Part Number") ? "text-destructive" : "text-muted-foreground"}`}
          >
            Part Number:
          </Label>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SearchablePartPicker
              items={items}
              value={part.item_id}
              onSelect={(id) => onPartSelect(index, id)}
              hasError={showErrors && errors.includes("Part Number")}
            />
            {extraPartActions}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Label
            className={`w-32 shrink-0 ${showErrors && errors.includes("Location") ? "text-destructive" : "text-muted-foreground"}`}
          >
            Location:
          </Label>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SearchableLocationPicker
              locations={locations}
              value={part.location_id}
              onSelect={(id) => onFieldChange(index, "location_id", id)}
              hasError={showErrors && errors.includes("Location")}
            />
            {extraLocationActions}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Label
            className={`w-32 shrink-0 ${showErrors && errors.includes("Quantity") ? "text-destructive" : "text-muted-foreground"}`}
          >
            Quantity:
          </Label>
          <Input
            type="number"
            min="1"
            value={part.quantity}
            onChange={(e) => onFieldChange(index, "quantity", e.target.value)}
            className={`min-w-0 flex-1 ${showErrors && errors.includes("Quantity") ? "border-destructive" : ""}`}
          />
        </div>

        <div className="flex items-center gap-4">
          <Label
            className={`w-32 shrink-0 ${showErrors && errors.includes(priceLabel) ? "text-destructive" : "text-muted-foreground"}`}
          >
            {priceLabel}:
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={part.price}
            onChange={(e) => onFieldChange(index, "price", e.target.value)}
            className={`min-w-0 flex-1 ${showErrors && errors.includes(priceLabel) ? "border-destructive" : ""}`}
          />
        </div>

        <div className="flex items-center gap-4">
          <Label className="w-32 shrink-0 text-muted-foreground">Currency:</Label>
          <Select value={part.currency_code} onValueChange={(v) => onFieldChange(index, "currency_code", v)}>
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="£">£</SelectItem>
              <SelectItem value="$">$</SelectItem>
              <SelectItem value="€">€</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
