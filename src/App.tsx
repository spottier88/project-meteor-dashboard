import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Index } from "@/pages/Index";
import { Login } from "@/pages/Login";
import { ProjectSummary } from "@/pages/ProjectSummary";
import { TaskManagement } from "@/pages/TaskManagement";
import { RiskManagement } from "@/pages/RiskManagement";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { OrganizationManagement } from "@/pages/OrganizationManagement";
import { UserManagement } from "@/pages/UserManagement";
import { Toaster } from "@/components/ui/sonner";
import { ReviewHistory } from "@/components/ReviewHistory";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/history"
            element={
              <ProtectedRoute>
                <ReviewHistory standalone={true} />
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
            path="/risks/:projectId"
            element={
              <ProtectedRoute>
                <RiskManagement />
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
            path="/admin/organization"
            element={
              <ProtectedRoute>
                <OrganizationManagement />
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
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;