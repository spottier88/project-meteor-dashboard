import { Document, Page } from "@react-pdf/renderer";
import { styles } from "./pdf/PDFStyles";
import { PDFHeader } from "./pdf/PDFHeader";
import { PDFProjectInfo } from "./pdf/PDFProjectInfo";
import { PDFLastReview } from "./pdf/PDFLastReview";
import { PDFRisks } from "./pdf/PDFRisks";
import { PDFFooter } from "./pdf/PDFFooter";
import { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type ProgressStatus = Database["public"]["Enums"]["progress_status"];
type RiskProbability = Database["public"]["Enums"]["risk_probability"];
type RiskSeverity = Database["public"]["Enums"]["risk_severity"];
type RiskStatus = Database["public"]["Enums"]["risk_status"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface ProjectPDFProps {
  project: {
    title: string;
    status: ProjectStatus;
    progress: ProgressStatus;
    completion: number;
    project_manager?: string;
    last_review_date: string;
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

export const ProjectPDF = ({ project, lastReview, risks, tasks }: ProjectPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <PDFHeader title={project.title} />
      <PDFProjectInfo project={project} />
      {lastReview && <PDFLastReview review={lastReview} />}
      <PDFRisks risks={risks} />
      <PDFFooter />
    </Page>
  </Document>
);