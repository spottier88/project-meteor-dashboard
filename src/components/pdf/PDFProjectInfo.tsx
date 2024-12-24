import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { statusLabels, progressLabels } from "./PDFLabels";

interface PDFProjectInfoProps {
  project: {
    project_manager?: string;
    status: keyof typeof statusLabels;
    progress: keyof typeof progressLabels;
    completion: number;
    last_review_date: string;
  };
}

export const PDFProjectInfo = ({ project }: PDFProjectInfoProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Informations générales</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Chef de projet</Text>
      <Text style={styles.value}>{project.project_manager || "-"}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Statut</Text>
      <Text style={styles.value}>{statusLabels[project.status]}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Progression</Text>
      <Text style={styles.value}>{progressLabels[project.progress]}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Avancement</Text>
      <Text style={styles.value}>{project.completion}%</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Dernière revue</Text>
      <Text style={styles.value}>
        {new Date(project.last_review_date).toLocaleDateString("fr-FR")}
      </Text>
    </View>
  </View>
);