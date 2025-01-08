import { View, Text } from "@react-pdf/renderer";
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
    status: TaskStatus;
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
    <View style={styles.situationRow}>
      <Text style={styles.situationText}>Situation générale</Text>
    </View>
    <View style={styles.content}>
      <PDFProjectInfo project={project} />
      {lastReview && <PDFLastReview review={lastReview} />}
      <PDFTasks tasks={tasks} />
      <PDFRisks risks={risks} />
    </View>
    <PDFFooter />
  </View>
);