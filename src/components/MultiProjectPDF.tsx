import { Document, Page } from "@react-pdf/renderer";
import { ProjectPDF } from "./ProjectPDF";
import { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type ProgressStatus = Database["public"]["Enums"]["progress_status"];
type RiskProbability = Database["public"]["Enums"]["risk_probability"];
type RiskSeverity = Database["public"]["Enums"]["risk_severity"];
type RiskStatus = Database["public"]["Enums"]["risk_status"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface ProjectData {
  project: {
    title: string;
    status: ProjectStatus;
    progress: ProgressStatus;
    completion: number;
    project_manager?: string;
    last_review_date: string;
    start_date?: string;
    end_date?: string;
    pole_name?: string;
    direction_name?: string;
    service_name?: string;
  };
  lastReview?: {
    weather: ProjectStatus;
    progress: ProgressStatus;
    comment?: string;
    created_at: string;
  };
  risks: Array<{
    description: string;
    probability: RiskProbability;
    severity: RiskSeverity;
    status: RiskStatus;
    mitigation_plan?: string;
  }>;
  tasks: Array<{
    title: string;
    description?: string;
    status: TaskStatus;
    due_date?: string;
    assignee?: string;
  }>;
}

interface MultiProjectPDFProps {
  projectsData: ProjectData[];
}

export const MultiProjectPDF = ({ projectsData }: MultiProjectPDFProps) => {
  return (
    <Document>
      {projectsData.map((data, index) => (
        <Page key={index}>
          <ProjectPDF
            project={data.project}
            lastReview={data.lastReview}
            risks={data.risks}
            tasks={data.tasks}
          />
        </Page>
      ))}
    </Document>
  );
};