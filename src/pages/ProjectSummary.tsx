import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@supabase/auth-helpers-react";
import { canManageProjectItems } from "@/utils/permissions";
import { useState, useEffect } from "react";
import { TaskForm } from "@/components/TaskForm";
import { ProjectSummaryContent } from "@/components/project/ProjectSummaryContent";
import { useToast } from "@/components/ui/use-toast";

export const ProjectSummary = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const user = useUser();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const { toast } = useToast();

  const { data: project, isError: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) {
        navigate("/");
        return null;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger le projet",
        });
        throw error;
      }
      
      if (!data) {
        toast({
          variant: "destructive",
          title: "Projet non trouvé",
          description: "Le projet demandé n'existe pas",
        });
        navigate("/");
        return null;
      }
      
      return data;
    },
    enabled: !!projectId,
  });

  const { data: lastReview } = useQuery({
    queryKey: ["lastReview", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: risks } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!project) return;
      
      const roles = userRoles?.map(ur => ur.role);
      const hasPermission = await canManageProjectItems(
        roles,
        user?.id,
        project.id,
        project.project_manager,
        userProfile?.email
      );
      setCanManage(hasPermission);
    };

    checkPermissions();
  }, [project, userRoles, user?.id, userProfile?.email]);

  if (!project || projectError) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>

      <ProjectSummaryContent
        project={project}
        lastReview={lastReview}
        risks={risks || []}
        tasks={tasks || []}
        canManage={canManage}
      />

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={() => {
          setIsTaskFormOpen(false);
        }}
        projectId={projectId || ""}
      />
    </div>
  );
};