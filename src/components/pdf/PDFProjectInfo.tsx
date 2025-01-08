import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

interface PDFProjectInfoProps {
  project: {
    title: string;
    description?: string;
    project_manager?: string;
    start_date?: string;
    end_date?: string;
  };
}

export const PDFProjectInfo = ({ project }: PDFProjectInfoProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Informations générales</Text>
    <View style={styles.projectHeader}>
      <Text style={styles.projectTitle}>{project.title}</Text>
      {project.description && (
        <Text style={styles.projectDescription}>{project.description}</Text>
      )}
    </View>
    <View style={styles.infoGrid}>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Chef de projet</Text>
        <Text style={styles.value}>{project.project_manager || "-"}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Date de début</Text>
        <Text style={styles.value}>
          {project.start_date
            ? new Date(project.start_date).toLocaleDateString("fr-FR")
            : "-"}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Date de fin</Text>
        <Text style={styles.value}>
          {project.end_date
            ? new Date(project.end_date).toLocaleDateString("fr-FR")
            : "-"}
        </Text>
      </View>
    </View>
  </View>
);