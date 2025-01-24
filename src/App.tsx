import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Login from "./pages/Login";
import { TaskManagement } from "./pages/TaskManagement";
import { ProjectSummary } from "./pages/ProjectSummary";
import { RiskManagement } from "./pages/RiskManagement";
import { UserManagement } from "./pages/UserManagement";
import { AdminDashboard } from "./pages/AdminDashboard";
import { OrganizationManagement } from "./pages/OrganizationManagement";
import { NotificationManagement } from "./pages/NotificationManagement";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ReviewHistory } from "./components/ReviewHistory";
import { ManagerAssignments } from "./pages/ManagerAssignments";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute>
                  <NotificationManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/:userId/assignments"
              element={
                <ProtectedRoute>
                  <ManagerAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organization"
              element={
                <ProtectedRoute>
                  <OrganizationManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:projectId"
              element={
                <ProtectedRoute>
                  <TaskManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectSummary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/risks/:projectId"
              element={
                <ProtectedRoute>
                  <RiskManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews/:projectId"
              element={
                <ProtectedRoute>
                  <ReviewHistory />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <Toaster />
      </SessionContextProvider>
    </QueryClientProvider>
  );
}

export default App;