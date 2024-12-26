import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { ProjectPDF } from "@/components/ProjectPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RiskTable } from "@/components/risk/RiskTable";
import { TaskTable } from "@/components/task/TaskTable";
import { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type ProgressStatus = Database["public"]["Enums"]["progress_status"];
type RiskProbability = Database["public"]["Enums"]["risk_probability"];
type RiskSeverity = Database["public"]["Enums"]["risk_severity"];
type RiskStatus = Database["public"]["Enums"]["risk_status"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

type Project = {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  project_manager?: string;
  last_review_date: string;
};

type Risk = {
  id: string;
  description: string;
  probability: RiskProbability;
  severity: RiskSeverity;
  status: RiskStatus;
  mitigation_plan?: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: string;
  due_date?: string;
};

export const ProjectSummary = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
  });

  useEffect(() => {
    const fetchRisks = async () => {
      const { data } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setRisks(data as Risk[] || []);
    };

    const fetchTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setTasks(data as Task[] || []);
    };

    if (projectId) {
      fetchRisks();
      fetchTasks();
    }
  }, [projectId]);

  if (isLoading || !project) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 space-y-4">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Résumé du Projet
          </h1>
          <PDFDownloadLink
            document={<ProjectPDF project={project} risks={risks} />}
            fileName={`${project.title}-summary.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading}>
                <FileDown className="mr-2 h-4 w-4" />
                {loading ? "Génération..." : "Télécharger le PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="space-y-6">
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
            <h2 className="text-2xl font-semibold tracking-tight">
              Risques ({risks.length})
            </h2>
            <RiskTable risks={risks} projectId={project.id} />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              Tâches ({tasks.length})
            </h2>
            <TaskTable tasks={tasks} projectId={project.id} />
          </div>
        </div>
      </div>
    </div>
  );
};