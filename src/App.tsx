import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Index } from "./pages/Index";
import { Login } from "./pages/Login";
import { ProjectSummary } from "./pages/ProjectSummary";
import { TaskManagement } from "./pages/TaskManagement";
import { RiskManagement } from "./pages/RiskManagement";
import { AdminDashboard } from "./pages/AdminDashboard";
import { UserManagement } from "./pages/UserManagement";
import { OrganizationManagement } from "./pages/OrganizationManagement";
import { ManagerAssignments } from "./pages/ManagerAssignments";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/toaster";
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
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/tasks"
            element={
              <ProtectedRoute>
                <TaskManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/risks"
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
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagement />
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
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;