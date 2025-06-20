
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import { TeamActivities as Activities } from "@/pages/TeamActivities";
import { TaskManagement as Tasks } from "@/pages/TaskManagement";
import { RiskManagement as Risks } from "@/pages/RiskManagement";
import { ProjectFraming as Framing } from "@/pages/ProjectFraming";
import { ProjectTeamManagement as Team } from "@/pages/ProjectTeamManagement";
import ProjectsList from "@/pages/ProjectsList";
import { ProjectSummary as ProjectDetails } from "@/pages/ProjectSummary";
import { MyTasks } from "@/pages/MyTasks";
import { TeamActivities } from "@/pages/TeamActivities";
import { AdminDashboard as Admin } from "@/pages/AdminDashboard";
import { UserManagement as Users } from "@/pages/UserManagement";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import PortfolioManagement from "@/pages/PortfolioManagement";
import { ReviewHistory as Reviews } from "@/components/ReviewHistory";

export function AppRoutes() {
  return (
    <Router>
      <SessionContextProvider supabaseClient={supabase}>
        <PermissionsProvider>
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
              path="/activities"
              element={
                <ProtectedRoute>
                  <Activities />
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
          </Routes>
        </PermissionsProvider>
      </SessionContextProvider>
    </Router>
  );
}
