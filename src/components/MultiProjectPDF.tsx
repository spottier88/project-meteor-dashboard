import { Document, Page } from "@react-pdf/renderer";
import { ProjectPDF } from "./ProjectPDF";
import { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type ProgressStatus = Database["public"]["Enums"]["progress_status"];
type RiskProbability = Database["public"]["Enums"]["risk_probability"];
type RiskSeverity = Database["public"]["Enums"]["risk_severity"];
type RiskStatus = Database["public"]["Enums"]["risk_status"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  project_manager?: string;
  last_review_date: string;
  poles?: { id: string; name: string; } | null;
  directions?: { id: string; name: string; } | null;
  services?: { id: string; name: string; } | null;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    due_date?: string;
    assignee?: string;
  }>;
  risks: Array<{
    id: string;
    description: string;
    probability: RiskProbability;
    severity: RiskSeverity;
    status: RiskStatus;
    mitigation_plan?: string;
  }>;
  reviews: Array<{
    id: string;
    weather: ProjectStatus;
    progress: ProgressStatus;
    comment?: string;
    created_at: string;
    review_actions: Array<{
      id: string;
      description: string;
    }>;
  }>;
}

interface MultiProjectPDFProps {
  projects: Project[];
}

export const MultiProjectPDF = ({ projects }: MultiProjectPDFProps) => {
  return (
    <Document>
      {projects.map((project) => {
        const lastReview = project.reviews?.[0];
        return (
          <Page key={project.id}>
            <ProjectPDF
              project={{
                title: project.title,
                status: project.status,
                progress: project.progress,
                completion: project.completion,
                project_manager: project.project_manager,
                last_review_date: project.last_review_date,
              }}
              lastReview={lastReview ? {
                weather: lastReview.weather,
                progress: lastReview.progress,
                comment: lastReview.comment,
                created_at: lastReview.created_at,
              } : undefined}
              risks={project.risks}
              tasks={project.tasks}
            />
          </Page>
        );
      })}
    </Document>
  );
};