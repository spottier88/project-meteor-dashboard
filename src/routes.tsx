
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import { TaskManagement } from "./pages/TaskManagement";
import { ProjectSummary } from "./pages/ProjectSummary";
import { RiskManagement } from "./pages/RiskManagement";
import { UserManagement } from "./pages/UserManagement";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProjectTemplateManagement } from "./pages/ProjectTemplateManagement";
import { ProjectTemplateDetails } from "./pages/ProjectTemplateDetails";
import { OrganizationManagement } from "./pages/OrganizationManagement";
import { NotificationManagement } from "./pages/NotificationManagement";
import PortfolioManagement from "./pages/PortfolioManagement";
import { SessionContextProvider, useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ReviewHistory } from "./components/ReviewHistory";
import { ManagerAssignments } from "./pages/ManagerAssignments";
import { ProjectTeamManagement } from "./pages/ProjectTeamManagement";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { useEffect } from "react";
import { useToast } from "./components/ui/use-toast";
import { ActivityManagement } from "@/components/activities/ActivityManagement";
import { TeamActivities } from "./pages/TeamActivities";
import { GeneralSettings } from "@/components/admin/GeneralSettings";
import { ActivityTypeManagementPage } from "./pages/ActivityTypeManagement";
import { AIPromptManagement } from "./pages/AIPromptManagement";
import { logger } from "./utils/logger";
import { ProjectFraming } from "./pages/ProjectFraming";
import { MyTasks } from "./pages/MyTasks";

export const AppRoutes = () => {
  const session = useSession();
  const { toast } = useToast();

  useEffect(() => {
    logger.debug(
      `Session state: isAuthenticated=${!!session}, user=${session?.user?.email || 'none'}, timestamp=${new Date().toISOString()}`,
      "auth"
    );
  }, [session]);

  if (!session) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    );
  }

  return (
    <PermissionsProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolios"
            element={
              <ProtectedRoute>
                <PortfolioManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <ActivityManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team-activities"
            element={
              <ProtectedRoute>
                <TeamActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute>
                <MyTasks />
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
            path="/admin/activity-types"
            element={
              <ProtectedRoute>
                <ActivityTypeManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <GeneralSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-prompts"
            element={
              <ProtectedRoute>
                <AIPromptManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <ProtectedRoute>
                <ProjectTemplateManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/templates/:templateId"
            element={
              <ProtectedRoute>
                <ProjectTemplateDetails />
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
            path="/projects/:projectId/team"
            element={
              <ProtectedRoute>
                <ProjectTeamManagement />
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
          <Route
            path="/framing/:projectId"
            element={
              <ProtectedRoute>
                <ProjectFraming />
              </ProtectedRoute>
            }
          />
        </Routes>
        <FeedbackButton />
      </Router>
      <Toaster />
    </PermissionsProvider>
  );
};
