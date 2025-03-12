import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/project/OverviewTab";
import { TaskSection } from "@/components/project/TaskSection";
import { RiskSection } from "@/components/project/RiskSection";
import { ReviewSection } from "@/components/project/ReviewSection";
import { ProjectTeamSection } from "@/components/project/ProjectTeamSection";

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required");
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les détails du projet",
        });
        throw error;
      }

      return data;
    },
  });

  if (isLoading) {
    return <div>Chargement des détails du projet...</div>;
  }

  if (isError || !project) {
    return <div>Erreur lors du chargement des détails du projet.</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au tableau de bord
      </Button>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>
      
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="risks">Risques</TabsTrigger>
          <TabsTrigger value="reviews">Revues</TabsTrigger>
		  <TabsTrigger value="team">Équipe</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab project={project} />
        </TabsContent>
        
        <TabsContent value="tasks">
          <TaskSection projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="risks">
          <RiskSection projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="reviews">
          <ReviewSection projectId={project.id} />
        </TabsContent>

		<TabsContent value="team">
		  	<ProjectTeamSection projectId={project.id} />
		</TabsContent>
      </Tabs>
    </div>
  );
};
