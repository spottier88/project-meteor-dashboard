import { DashboardHeader } from "@/components/DashboardHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { useToast } from "@/components/ui/use-toast";
import { ProjectStatus, ProgressStatus } from "@/components/ProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const fetchProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('last_review_date', { ascending: false });

  if (error) throw error;
  return data.map(project => ({
    ...project,
    id: project.id.toString(),
    lastReviewDate: new Date(project.last_review_date).toLocaleDateString('fr-FR'),
  }));
};

const Index = () => {
  const { toast } = useToast();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const handleNewReview = () => {
    toast({
      title: "Bientôt disponible",
      description: "Le formulaire de revue sera implémenté dans la prochaine itération.",
    });
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
        <p className="text-lg text-destructive">Une erreur est survenue lors du chargement des projets.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen animate-fade-in">
      <DashboardHeader onNewReview={handleNewReview} />
      <ProjectGrid projects={projects || []} />
    </div>
  );
};

export default Index;