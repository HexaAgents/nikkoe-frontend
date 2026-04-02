import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useCurrentUser() {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ["current_user", authUser?.id],
    queryFn: () => api.get<{ user_id: string; name: string; email_address: string | null; role: string | null }>("/users/me"),
    enabled: !!authUser?.id,
  });
}
