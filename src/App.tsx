import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserManagement } from "@/pages/UserManagement";
import { RiskManagement } from "@/pages/RiskManagement";
import { TaskManagement } from "@/pages/TaskManagement";
import { TeamManagement } from "@/pages/TeamManagement"; // Import de la nouvelle page TeamManagement

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagement />
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
            path="/tasks"
            element={
              <ProtectedRoute>
                <TaskManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/team"
            element={
              <ProtectedRoute>
                <TeamManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
