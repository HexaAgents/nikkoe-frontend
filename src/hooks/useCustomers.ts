import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => api.get<any[]>("/customers"),
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.post("/customers", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast.error(`Failed to add customer: ${error.message}`);
    },
  });
}
