import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/ProjectCard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ProjectForm } from "@/components/ProjectForm";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ProjectSelectionModal } from "@/components/ProjectSelectionModal";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

const Index: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProjectDeletionDialogOpen, setIsProjectDeletionDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [showProjectSelectionModal, setShowProjectSelectionModal] = useState(false);
  const [selectionAction, setSelectionAction] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = usePermissionsContext();

  const { data: initialProjects, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les projets",
        });
        throw error;
      }

      return data || [];
    },
  });

  useEffect(() => {
    if (initialProjects) {
      setProjects(initialProjects);
    }
  }, [initialProjects]);

  const handleProjectCreated = (newProject: any) => {
    setProjects((prevProjects) => [newProject, ...prevProjects]);
  };

  const handleProjectUpdated = (updatedProject: any) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects((prevProjects) =>
      prevProjects.filter((project) => project.id !== projectId)
    );
  };

  const onNewProject = () => {
    setIsDialogOpen(true);
  };

  const onNewReview = () => {
    // Nous devons demander à l'utilisateur de sélectionner un projet
    setShowProjectSelectionModal(true);
    setSelectionAction('review');
  };

  // Cherchons la fonction onNewFrameworkNote et assurons-nous qu'elle navigue correctement
  const onNewFrameworkNote = () => {
    // Nous devons demander à l'utilisateur de sélectionner un projet
    setShowProjectSelectionModal(true);
    setSelectionAction('framework-note');
  };

  const handleProjectSelection = (projectId: string) => {
    setSelectedProject(projectId);
    setShowProjectSelectionModal(false);

    // Dans le switch-case pour handleProjectSelection
    switch (selectionAction) {
      case 'tasks':
        navigate(`/tasks/${selectedProject}`);
        break;
      case 'review':
        navigate(`/reviews/${selectedProject}`);
        break;
      case 'risks':
        navigate(`/risks/${selectedProject}`);
        break;
      case 'framework-note':
        navigate(`/framework-notes/${selectedProject}`);
        break;
      default:
        break;
    }
  };

  const handleCancelSelection = () => {
    setShowProjectSelectionModal(false);
    setSelectionAction(null);
    setSelectedProject(null);
  };

  const confirmDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setIsProjectDeletionDialogOpen(true);
  };

  const deleteProject = async () => {
    if (!projectToDelete) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le projet',
      });
    } else {
      toast({
        title: 'Projet supprimé',
        description: 'Le projet a été supprimé avec succès',
      });
      handleProjectDeleted(projectToDelete);
    }

    setIsProjectDeletionDialogOpen(false);
    setProjectToDelete(null);
    refetch();
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Chargement des projets...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <DashboardHeader 
        onNewProject={onNewProject} 
        onNewReview={onNewReview}
        onNewFrameworkNote={onNewFrameworkNote}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onProjectUpdated={handleProjectUpdated}
            onDelete={confirmDeleteProject}
          />
        ))}
      </div>

      <ProjectForm
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <AlertDialog open={isProjectDeletionDialogOpen} onOpenChange={setIsProjectDeletionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Le projet sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={deleteProject}>Supprimer</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <ProjectSelectionModal
        isOpen={showProjectSelectionModal}
        onProjectSelected={handleProjectSelection}
        onCancel={handleCancelSelection}
      />
    </div>
  );
};

export default Index;
