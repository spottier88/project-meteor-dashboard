import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Activities from "@/pages/Activities";
import Monitoring from "@/pages/Monitoring";
import Users from "@/pages/Users";
import Organization from "@/pages/Organization";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Documentation from "@/pages/Documentation";
import GeneralSettings from "@/pages/GeneralSettings";

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <div className="relative flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
              <main className="flex-1">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
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
                    path="/monitoring"
                    element={
                      <ProtectedRoute>
                        <Monitoring />
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
                    path="/organization"
                    element={
                      <ProtectedRoute>
                        <Organization />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <GeneralSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/docs"
                    element={
                      <ProtectedRoute>
                        <Documentation />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
