import { View } from "@react-pdf/renderer";
import { styles } from "./pdf/PDFStyles";
import { PDFHeader } from "./pdf/PDFHeader";
import { PDFProjectInfo } from "./pdf/PDFProjectInfo";
import { PDFLastReview } from "./pdf/PDFLastReview";
import { PDFTasks } from "./pdf/PDFTasks";
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
    description?: string;
    status: TaskStatus;
    due_date?: string;
    assignee?: string;
  }>;
  risks: Array<{
    description: string;
    probability: RiskProbability;
    severity: RiskSeverity;
    status: RiskStatus;
    mitigation_plan?: string;
  }>;
}

export const ProjectPDF = ({ project, lastReview, tasks, risks }: ProjectPDFProps) => (
  <View style={styles.page}>
    <PDFHeader title={project.title} />
    <PDFProjectInfo project={project} />
    {lastReview && <PDFLastReview review={lastReview} />}
    <PDFTasks tasks={tasks} />
    <PDFRisks risks={risks} />
    <PDFFooter />
  </View>
);