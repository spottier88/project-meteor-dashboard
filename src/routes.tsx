import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { Home } from "@/pages/Home";
import { Index } from "@/pages/Index";
import { Activities } from "@/pages/Activities";
import { Tasks } from "@/pages/Tasks";
import { Risks } from "@/pages/Risks";
import { Framing } from "@/pages/Framing";
import { Team } from "@/pages/Team";
import { Projects } from "@/pages/Projects";
import { ProjectDetails } from "@/pages/ProjectDetails";
import { Reviews } from "@/pages/Reviews";
import { Admin } from "@/pages/Admin";
import { Users } from "@/pages/Users";
import { MyTasks } from "@/pages/MyTasks";
import { TeamActivities } from "@/pages/TeamActivities";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { QueryClient } from "@tanstack/react-query";
import PortfolioManagement from "@/pages/PortfolioManagement";

export function AppRoutes() {
  return (
    <QueryClient>
      <Router>
        <SessionContextProvider supabaseClient={supabase}>
          <PermissionsProvider>
            <Routes>
              <Route path="/login" element={<Home />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Index />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Activities />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/:projectId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Tasks />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/risks/:projectId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Risks />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/framing/:projectId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Framing />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/team"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Team />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Projects />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews/:projectId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Reviews />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Admin />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tasks"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MyTasks />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-activities"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TeamActivities />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolios"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PortfolioManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </PermissionsProvider>
        </SessionContextProvider>
      </Router>
    </QueryClient>
  );
}
