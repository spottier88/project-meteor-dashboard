import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Login from "./pages/Login";
import { TaskManagement } from "./pages/TaskManagement";
import { ProjectSummary } from "./pages/ProjectSummary";
import { RiskManagement } from "./pages/RiskManagement";
import { AdminDashboard } from "./pages/AdminDashboard";
import { UserManagement } from "./pages/UserManagement";
import { OrganizationManagement } from "./pages/OrganizationManagement";
import { ManagerAssignments } from "./pages/ManagerAssignments";
import { NotificationManagement } from "./pages/NotificationManagement";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardHeader } from "./components/DashboardHeader";
import { ProjectCart } from "./components/cart/ProjectCart";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <ProjectCart />
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
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TaskManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/risks"
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
              path="/users"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organization"
              element={
                <ProtectedRoute>
                  <OrganizationManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <ManagerAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationManagement />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;