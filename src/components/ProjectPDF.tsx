import { Document, Page } from "@react-pdf/renderer";
import { styles } from "./pdf/PDFStyles";
import { PDFHeader } from "./pdf/PDFHeader";
import { PDFProjectInfo } from "./pdf/PDFProjectInfo";
import { PDFLastReview } from "./pdf/PDFLastReview";
import { PDFRisks } from "./pdf/PDFRisks";
import { PDFFooter } from "./pdf/PDFFooter";
import { ProjectStatus, ProgressStatus } from "./ProjectCard";

interface Risk {
  description: string;
  probability: "low" | "medium" | "high";
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  mitigation_plan?: string;
}

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
  risks: Risk[];
}

export const ProjectPDF = ({ project, lastReview, risks }: ProjectPDFProps) => (
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