import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://uskprncctxqhjoakncea.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_7VRG3vUZoN0Fiayyqn9n5w_YtlSIvmp";

export const testSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
