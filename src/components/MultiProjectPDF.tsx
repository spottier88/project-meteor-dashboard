import { Document } from "@react-pdf/renderer";
import { ProjectPDF } from "./ProjectPDF";

interface ProjectData {
  project: any;
  lastReview: any;
  risks: any[];
  tasks: any[];
}

interface MultiProjectPDFProps {
  projectsData: ProjectData[];
}

export const MultiProjectPDF = ({ projectsData }: MultiProjectPDFProps) => (
  <Document>
    {projectsData.map((data, index) => (
      <ProjectPDF
        key={index}
        project={data.project}
        lastReview={data.lastReview}
        risks={data.risks}
        tasks={data.tasks}
      />
    ))}
  </Document>
);