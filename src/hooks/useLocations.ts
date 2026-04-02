import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => api.get<any[]>("/locations"),
  });
}

export function useAddLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (location: { location_code: string }) => api.post("/locations", location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add location: ${error.message}`);
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) => api.del(`/locations/${locationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete location: ${error.message}`);
    },
  });
}
