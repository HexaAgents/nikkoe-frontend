import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface SupplierInput {
  supplier_name: string;
  supplier_address?: string;
  supplier_email?: string;
  supplier_phone?: string;
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.get<any[]>("/suppliers"),
  });
}

export function useAddSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplier: SupplierInput) => api.post("/suppliers", supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add supplier: ${error.message}`);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplierId: string) => api.del(`/suppliers/${supplierId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
}
