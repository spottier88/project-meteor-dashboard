
import {
  createBrowserRouter,
} from "react-router-dom";
import App from "./App";
import { ErrorPage } from "./components/ErrorPage";
import { Login } from "./pages/Login";
import { AuthCallback } from "./pages/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminDashboard } from "./pages/AdminDashboard";
import { UsersManagement } from "./pages/UsersManagement";
import { OrganizationManagement } from "./pages/OrganizationManagement";
import { NotificationsManagement } from "./pages/NotificationsManagement";
import { ActivityTypesManagement } from "./pages/ActivityTypesManagement";
import { SettingsManagement } from "./pages/SettingsManagement";
import { AiPromptsManagement } from "./pages/AiPromptsManagement";
import { ProjectTemplateManagement } from "./pages/ProjectTemplateManagement";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/project-templates",
    element: (
      <ProtectedRoute requiredRole={["admin"]}>
        <ProjectTemplateManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute requiredRole={["admin"]}>
        <UsersManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/organization",
    element: (
      <ProtectedRoute requiredRole={["admin"]}>
        <OrganizationManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/notifications",
    element: (
      <ProtectedRoute requiredRole={["admin"]}>
        <NotificationsManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/activity-types",
    element: (
      <ProtectedRoute requiredRole={["admin"]}>
        <ActivityTypesManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <ProtectedRoute requiredRole={["admin"]}>
        <SettingsManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/ai-prompts",
    element: (
      <ProtectedRoute requiredRole={["admin"]}>
        <AiPromptsManagement />
      </ProtectedRoute>
    ),
  },
]);

// Ajout de l'export pour AppRoutes qui sera utilisé dans App.tsx
export const AppRoutes = () => {
  return null; // Cette fonction sera appelée dans App.tsx
};
