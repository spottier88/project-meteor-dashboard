
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { AppRoutes } from "./routes";
import { Toaster } from "@/components/ui/toaster";

// Configurez le client de requête pour React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
        <AppRoutes />
        <Toaster />
      </SessionContextProvider>
    </QueryClientProvider>
  );
}

export default App;
