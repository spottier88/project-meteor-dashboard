import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import { TeamActivities } from "@/pages/TeamActivities";
import { TaskManagement as Tasks } from "@/pages/TaskManagement";
import { RiskManagement as Risks } from "@/pages/RiskManagement";
import { ProjectFraming as Framing } from "@/pages/ProjectFraming";
import { ProjectTeamManagement as Team } from "@/pages/ProjectTeamManagement";
import ProjectsList from "@/pages/ProjectsList";
import { ProjectSummary as ProjectDetails } from "@/pages/ProjectSummary";
import { MyTasks } from "@/pages/MyTasks";
import { AdminDashboard as Admin } from "@/pages/AdminDashboard";
import { UserManagement as Users } from "@/pages/UserManagement";
import { NotificationManagement } from "@/pages/NotificationManagement";
import { ActivityTypeManagementPage } from "@/pages/ActivityTypeManagement";
import { OrganizationManagement } from "@/pages/OrganizationManagement";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import PortfolioManagement from "@/pages/PortfolioManagement";
import { ReviewHistory as Reviews } from "@/components/ReviewHistory";
import AuthCallback from "@/pages/AuthCallback";

export function AppRoutes() {
  return (
    <Router>
      <PermissionsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Routes protégées */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <TeamActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:projectId"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/risks/:projectId"
            element={
              <ProtectedRoute>
                <Risks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/framing/:projectId"
            element={
              <ProtectedRoute>
                <Framing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/team"
            element={
              <ProtectedRoute>
                <Team />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/:projectId"
            element={
              <ProtectedRoute>
                <Reviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <Users />
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
            path="/admin/activity-types"
            element={
              <ProtectedRoute>
                <ActivityTypeManagementPage />
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
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
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
            path="/team-activities"
            element={
              <ProtectedRoute>
                <TeamActivities />
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
          
          {/* Redirection par défaut vers login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </PermissionsProvider>
    </Router>
  );
}
