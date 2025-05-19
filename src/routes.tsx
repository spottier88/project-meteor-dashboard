
import {
  createBrowserRouter,
} from "react-router-dom";
import App from "./App";
import { ErrorPage } from "./components/ErrorPage";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProjectTemplateManagement } from "./pages/ProjectTemplateManagement";

// Créer des composants temporaires pour les pages non implémentées
const UsersManagement = () => <div>Gestion des utilisateurs</div>;
const OrganizationManagement = () => <div>Gestion des organisations</div>;
const NotificationsManagement = () => <div>Gestion des notifications</div>;
const ActivityTypesManagement = () => <div>Gestion des types d'activités</div>;
const SettingsManagement = () => <div>Gestion des paramètres</div>;
const AiPromptsManagement = () => <div>Gestion des prompts IA</div>;

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
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/project-templates",
    element: (
      <ProtectedRoute>
        <ProjectTemplateManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute>
        <UsersManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/organization",
    element: (
      <ProtectedRoute>
        <OrganizationManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/notifications",
    element: (
      <ProtectedRoute>
        <NotificationsManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/activity-types",
    element: (
      <ProtectedRoute>
        <ActivityTypesManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <ProtectedRoute>
        <SettingsManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/ai-prompts",
    element: (
      <ProtectedRoute>
        <AiPromptsManagement />
      </ProtectedRoute>
    ),
  },
]);

// Ajout de l'export pour AppRoutes qui sera utilisé dans App.tsx
export const AppRoutes = () => {
  return null; // Cette fonction sera appelée dans App.tsx
};
