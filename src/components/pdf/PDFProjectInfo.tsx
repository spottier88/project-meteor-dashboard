import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { statusLabels, progressLabels } from "./PDFLabels";

interface PDFProjectInfoProps {
  project: {
    title: string;
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
  <View>
    <View style={styles.situationRow}>
      <View style={styles.situationCell}>
        <Text>Situation</Text>
        <View style={[styles.statusBadge, styles[`status${project.status}`]]}>
          <Text>{statusLabels[project.status]}</Text>
        </View>
      </View>
      <View style={styles.situationCell}>
        <Text>Evolution</Text>
        <Text style={styles.contentText}>{progressLabels[project.progress]}</Text>
      </View>
      <View style={styles.situationCell}>
        <Text>Situation générale</Text>
        <Text style={styles.contentText}>{project.title}</Text>
      </View>
      <View style={styles.situationCell}>
        <Text>Fin cible</Text>
        <Text style={styles.contentText}>
          {project.end_date ? new Date(project.end_date).toLocaleDateString("fr-FR") : "À définir"}
        </Text>
      </View>
    </View>
    
    <View style={styles.mainContent}>
      <View style={styles.leftColumn}>
        <Text style={styles.sectionTitle}>État d'avancement</Text>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            Chef de projet : {project.project_manager || "Non assigné"}
          </Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            Avancement : {project.completion}%
          </Text>
        </View>
        {project.pole_name && (
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Pôle : {project.pole_name}
            </Text>
          </View>
        )}
        {project.direction_name && (
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Direction : {project.direction_name}
            </Text>
          </View>
        )}
        {project.service_name && (
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Service : {project.service_name}
            </Text>
          </View>
        )}
      </View>
    </View>
  </View>
);