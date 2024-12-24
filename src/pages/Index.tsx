import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ReviewSheet } from "@/components/ReviewSheet";
import { useToast } from "@/components/ui/use-toast";
import { ProjectStatus, ProgressStatus } from "@/components/ProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
};

const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("last_review_date", { ascending: false });

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
  }));
};

const Index = () => {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const handleNewReview = () => {
    toast({
      title: "Bientôt disponible",
      description: "Le formulaire de revue sera implémenté dans la prochaine itération.",
    });
  };

  const handleProjectReview = (id: string, title: string) => {
    setSelectedProject({ id, title });
  };

  const handleReviewSubmitted = () => {
    refetch();
  };

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

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen animate-fade-in">
      <DashboardHeader onNewReview={handleNewReview} />
      <ProjectGrid
        projects={projects || []}
        onProjectReview={handleProjectReview}
      />
      {selectedProject && (
        <ReviewSheet
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          isOpen={true}
          onClose={() => setSelectedProject(null)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default Index;