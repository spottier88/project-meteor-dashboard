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
    start_date?: string;
    end_date?: string;
    pole_name?: string;
    direction_name?: string;
    service_name?: string;
  };
}

export const PDFProjectInfo = ({ project }: PDFProjectInfoProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Informations générales</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Chef de projet</Text>
      <Text style={styles.value}>{project.project_manager || "-"}</Text>
    </View>
    {project.pole_name && (
      <View style={styles.row}>
        <Text style={styles.label}>Pôle</Text>
        <Text style={styles.value}>{project.pole_name}</Text>
      </View>
    )}
    {project.direction_name && (
      <View style={styles.row}>
        <Text style={styles.label}>Direction</Text>
        <Text style={styles.value}>{project.direction_name}</Text>
      </View>
    )}
    {project.service_name && (
      <View style={styles.row}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{project.service_name}</Text>
      </View>
    )}
    {project.start_date && (
      <View style={styles.row}>
        <Text style={styles.label}>Date de début</Text>
        <Text style={styles.value}>
          {new Date(project.start_date).toLocaleDateString("fr-FR")}
        </Text>
      </View>
    )}
    {project.end_date && (
      <View style={styles.row}>
        <Text style={styles.label}>Date de fin</Text>
        <Text style={styles.value}>
          {new Date(project.end_date).toLocaleDateString("fr-FR")}
        </Text>
      </View>
    )}
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