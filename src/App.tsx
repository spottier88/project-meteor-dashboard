
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ProjectCartProvider } from "@/contexts/ProjectCartContext";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import Index from "@/pages/Index";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Admin from "@/pages/Admin";
import Activities from "@/pages/Activities";
import TeamActivities from "@/pages/TeamActivities";
import FrameworkNotes from "@/pages/FrameworkNotes";
import { FrameworkNoteDetail } from "@/components/project/FrameworkNoteDetail";

const queryClient = new QueryClient();

function App() {
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{ id: string; title: string; } | null>(null);

  return (
    <div className="App flex flex-col h-screen">
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <SupabaseProvider>
          <PermissionsProvider>
            <ProjectCartProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  <Route element={<ProtectedRoute />}>
                    {/* Page d'accueil */}
                    <Route path="/" element={<Index />} />
                    
                    {/* Notes de cadrage */}
                    <Route path="/framework-notes" element={<FrameworkNotes />} />
                    <Route path="/framework-notes/:id" element={<FrameworkNoteDetail />} />
                    
                    {/* Page d'administration */}
                    <Route path="/admin" element={<Admin />} />

                    {/* Page des activités */}
                    <Route path="/activities" element={<Activities />} />

                    {/* Page des activités de l'équipe */}
                    <Route path="/team-activities" element={<TeamActivities />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </ProjectCartProvider>
          </PermissionsProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
