import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown, ArrowLeft, Plus, ListTodo, ShieldAlert } from "lucide-react";
import { ProjectPDF } from "@/components/ProjectPDF";
import { RiskList } from "@/components/RiskList";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LastReview } from "@/components/LastReview";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { useUser } from "@supabase/auth-helpers-react";
import { canManageProjectItems } from "@/utils/permissions";
import { ReviewSheet } from "@/components/ReviewSheet";
import { useState } from "react";

export const ProjectSummary = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const user = useUser();
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);

  const { data: project, isError: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
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

  if (!project || projectError) {
    return null;
  }

  const roles = userRoles?.map(ur => ur.role);
  const canManage = canManageProjectItems(roles, user?.id, project.owner_id);

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
        <PDFDownloadLink
          document={
            <ProjectPDF
              project={project}
              lastReview={lastReview || undefined}
              risks={risks || []}
              tasks={tasks || []}
            />
          }
          fileName={`${project.title}.pdf`}
        >
          {({ loading }) => (
            <Button disabled={loading}>
              <FileDown className="h-4 w-4 mr-2" />
              {loading ? "Génération..." : "Télécharger le PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="grid gap-6">
        <ProjectSummaryHeader
          title={project.title}
          description={project.description}
          status={project.status}
          progress={project.progress}
          completion={project.completion}
          project_manager={project.project_manager}
          last_review_date={project.last_review_date}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Dernière revue</h2>
              {canManage && (
                <Button onClick={() => setIsReviewSheetOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle revue
                </Button>
              )}
            </div>
            {lastReview && <LastReview review={lastReview} />}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Actions</h2>
            </div>
            <div className="grid gap-4">
              {canManage && (
                <>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate(`/tasks/${projectId}`)}
                  >
                    <ListTodo className="h-4 w-4 mr-2" />
                    Gérer les tâches
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate(`/risks/${projectId}`)}
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Gérer les risques
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Tâches</h2>
          <KanbanBoard projectId={projectId} />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Risques</h2>
          <RiskList projectId={projectId} projectTitle={project.title} />
        </div>
      </div>

      <ReviewSheet
        isOpen={isReviewSheetOpen}
        onClose={() => setIsReviewSheetOpen(false)}
        projectId={projectId}
        onSubmit={() => {
          setIsReviewSheetOpen(false);
        }}
      />
    </div>
  );
};