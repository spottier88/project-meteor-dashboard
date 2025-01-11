import { Document, Page } from "@react-pdf/renderer";
import { ProjectPDF } from "./ProjectPDF";
import { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type ProgressStatus = Database["public"]["Enums"]["progress_status"];
type RiskProbability = Database["public"]["Enums"]["risk_probability"];
type RiskSeverity = Database["public"]["Enums"]["risk_severity"];
type RiskStatus = Database["public"]["Enums"]["risk_status"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

export interface MultiProjectPDFProps {
  projectsData: Array<{
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
    tasks: Array<{
      title: string;
      status: TaskStatus;
    }>;
    risks: Array<{
      description: string;
      probability: RiskProbability;
      severity: RiskSeverity;
      status: RiskStatus;
      mitigation_plan?: string;
    }>;
  }>;
}

export const MultiProjectPDF = ({ projectsData }: MultiProjectPDFProps) => {
  if (!projectsData || projectsData.length === 0) {
    return (
      <Document>
        <Page>
          <ProjectPDF
            project={{
              title: "Aucun projet",
              status: "sunny",
              progress: "stable",
              completion: 0,
              last_review_date: new Date().toISOString(),
            }}
            tasks={[]}
            risks={[]}
          />
        </Page>
      </Document>
    );
  }

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