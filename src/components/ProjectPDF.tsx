import { Document, Page } from "@react-pdf/renderer";
import { styles } from "./pdf/PDFStyles";
import { PDFHeader } from "./pdf/PDFHeader";
import { PDFProjectInfo } from "./pdf/PDFProjectInfo";
import { PDFLastReview } from "./pdf/PDFLastReview";
import { PDFRisks } from "./pdf/PDFRisks";
import { PDFFooter } from "./pdf/PDFFooter";

interface ProjectPDFProps {
  project: {
    title: string;
    status: string;
    progress: string;
    completion: number;
    project_manager?: string;
    last_review_date: string;
  };
  lastReview?: {
    weather: string;
    progress: string;
    comment?: string;
    created_at: string;
  };
  risks: Array<{
    description: string;
    probability: string;
    severity: string;
    status: string;
    mitigation_plan?: string;
  }>;
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