import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import { TaskManagement } from "./pages/TaskManagement";
import { ProjectSummary } from "./pages/ProjectSummary";
import { RiskManagement } from "./pages/RiskManagement";
import { Auth } from "./pages/Auth";
import { UserManagement } from "./pages/UserManagement";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-muted-foreground">Chargement...</p>
    </div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route
            path="/auth"
            element={isAuthenticated ? <Navigate to="/" /> : <Auth />}
          />
          <Route
            path="/"
            element={isAuthenticated ? <Index /> : <Navigate to="/auth" />}
          />
          <Route
            path="/tasks/:projectId"
            element={isAuthenticated ? <TaskManagement /> : <Navigate to="/auth" />}
          />
          <Route
            path="/projects/:projectId"
            element={isAuthenticated ? <ProjectSummary /> : <Navigate to="/auth" />}
          />
          <Route
            path="/risks/:projectId"
            element={isAuthenticated ? <RiskManagement /> : <Navigate to="/auth" />}
          />
          <Route
            path="/users"
            element={isAuthenticated ? <UserManagement /> : <Navigate to="/auth" />}
          />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;