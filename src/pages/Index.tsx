import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { ViewToggle } from "@/components/ViewToggle";
import { ReviewSheet } from "@/components/ReviewSheet";
import { ProjectForm } from "@/components/ProjectForm";
import { ReviewHistory } from "@/components/ReviewHistory";
import { ProjectSelectionSheet } from "@/components/ProjectSelectionSheet";
import { ProjectStatus, ProgressStatus } from "@/components/ProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { FilterToggle } from "@/components/FilterToggle";
import { useUser } from "@supabase/auth-helpers-react";
import { useToast } from "@/components/ui/use-toast";
import { UserRoleData } from "@/types/user";

type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
  description?: string;
  project_manager?: string;
  start_date?: string;
  end_date?: string;
  priority?: string;
  suivi_dgs?: boolean;
  owner_id?: string;
};

type ViewMode = "grid" | "table";

const fetchProjects = async (userEmail: string | undefined, isAdmin: boolean): Promise<Project[]> => {
  let query = supabase
    .from("projects")
    .select("*")
    .order("last_review_date", { ascending: false });

  // Si l'utilisateur n'est pas admin, on filtre pour ne montrer que ses projets
  if (!isAdmin && userEmail) {
    query = query.eq("project_manager", userEmail);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map((project) => ({
    id: project.id,
    title: project.title,
    status: project.status,
    progress: project.progress,
    completion: project.completion,
    lastReviewDate: new Date(project.last_review_date || "").toLocaleDateString(
      "fr-FR"
    ),
    description: project.description,
    project_manager: project.project_manager,
    start_date: project.start_date,
    end_date: project.end_date,
    priority: project.priority,
    suivi_dgs: project.suivi_dgs,
    owner_id: project.owner_id,
  }));
};

const Index = () => {
  const user = useUser();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProjectForHistory, setSelectedProjectForHistory] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const savedView = localStorage.getItem("preferredView");
    return (savedView as ViewMode) || "grid";
  });
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [showDgsOnly, setShowDgsOnly] = useState(false);

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(ur => ur.role === 'admin');

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ["projects", user?.email, isAdmin],
    queryFn: () => fetchProjects(user?.email, isAdmin),
    enabled: !!user?.email && userRoles !== undefined,
  });

  useEffect(() => {
    localStorage.setItem("preferredView", currentView);
  }, [currentView]);

  const handleNewProject = () => {
    setProjectToEdit(null);
    setIsProjectFormOpen(true);
  };

  const handleEditProject = async (id: string) => {
    const project = projects?.find((p) => p.id === id);
    if (project) {
      if (isAdmin || project.owner_id === user?.id) {
        setProjectToEdit(project);
        setIsProjectFormOpen(true);
      } else {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits pour modifier ce projet",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewReview = () => {
    setIsProjectSelectionOpen(true);
  };

  const handleProjectSelect = (id: string, title: string) => {
    setSelectedProject({ id, title });
    setIsProjectSelectionOpen(false);
  };

  const handleProjectReview = (id: string, title: string) => {
    setSelectedProject({ id, title });
  };

  const handleViewHistory = (id: string, title: string) => {
    setSelectedProjectForHistory({ id, title });
  };

  const handleReviewSubmitted = () => {
    refetch();
  };

  const filteredProjects = projects?.filter(project => 
    !showDgsOnly || project.suivi_dgs
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Chargement des projets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <p className="text-lg text-destructive">
          Une erreur est survenue lors du chargement des projets.
        </p>
      </div>
    );
  }

  if (selectedProjectForHistory) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <ReviewHistory
          projectId={selectedProjectForHistory.id}
          projectTitle={selectedProjectForHistory.title}
          onClose={() => setSelectedProjectForHistory(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen animate-fade-in">
      <DashboardHeader 
        onNewProject={handleNewProject}
        onNewReview={handleNewReview}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
        <FilterToggle showDgsOnly={showDgsOnly} onToggle={setShowDgsOnly} />
      </div>
      {currentView === "grid" ? (
        <ProjectGrid
          projects={filteredProjects || []}
          onProjectReview={handleProjectReview}
          onProjectEdit={handleEditProject}
          onViewHistory={handleViewHistory}
        />
      ) : (
        <ProjectTable
          projects={filteredProjects || []}
          onProjectReview={handleProjectReview}
          onProjectEdit={handleEditProject}
          onViewHistory={handleViewHistory}
        />
      )}
      {selectedProject && (
        <ReviewSheet
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          isOpen={true}
          onClose={() => setSelectedProject(null)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        onSubmit={refetch}
        project={projectToEdit || undefined}
      />
      <ProjectSelectionSheet
        projects={filteredProjects || []}
        isOpen={isProjectSelectionOpen}
        onClose={() => setIsProjectSelectionOpen(false)}
        onProjectSelect={handleProjectSelect}
      />
    </div>
  );
};

export default Index;
