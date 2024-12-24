import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 120,
    color: "#666666",
  },
  value: {
    flex: 1,
  },
  risk: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
  },
  riskTitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  riskDetail: {
    fontSize: 12,
    color: "#666666",
  },
});

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

const statusLabels = {
  sunny: "Ensoleillé",
  cloudy: "Nuageux",
  stormy: "Orageux",
};

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
};

const riskLabels = {
  probability: {
    low: "Faible",
    medium: "Moyenne",
    high: "Élevée",
  },
  severity: {
    low: "Faible",
    medium: "Moyenne",
    high: "Élevée",
  },
  status: {
    open: "Ouvert",
    in_progress: "En cours",
    resolved: "Résolu",
  },
};

export const ProjectPDF = ({ project, lastReview, risks }: ProjectPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{project.title}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations générales</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Chef de projet</Text>
          <Text style={styles.value}>{project.project_manager || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Statut</Text>
          <Text style={styles.value}>{statusLabels[project.status as keyof typeof statusLabels]}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Progression</Text>
          <Text style={styles.value}>{progressLabels[project.progress as keyof typeof progressLabels]}</Text>
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

      {lastReview && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernière revue</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {new Date(lastReview.created_at).toLocaleDateString("fr-FR")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Météo</Text>
            <Text style={styles.value}>
              {statusLabels[lastReview.weather as keyof typeof statusLabels]}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>État d'évolution</Text>
            <Text style={styles.value}>
              {progressLabels[lastReview.progress as keyof typeof progressLabels]}
            </Text>
          </View>
          {lastReview.comment && (
            <View style={styles.row}>
              <Text style={styles.label}>Commentaires</Text>
              <Text style={styles.value}>{lastReview.comment}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risques ({risks.length})</Text>
        {risks.map((risk, index) => (
          <View key={index} style={styles.risk}>
            <Text style={styles.riskTitle}>{risk.description}</Text>
            <Text style={styles.riskDetail}>
              Probabilité: {riskLabels.probability[risk.probability as keyof typeof riskLabels.probability]}
            </Text>
            <Text style={styles.riskDetail}>
              Gravité: {riskLabels.severity[risk.severity as keyof typeof riskLabels.severity]}
            </Text>
            <Text style={styles.riskDetail}>
              Statut: {riskLabels.status[risk.status as keyof typeof riskLabels.status]}
            </Text>
            {risk.mitigation_plan && (
              <Text style={styles.riskDetail}>
                Plan de mitigation: {risk.mitigation_plan}
              </Text>
            )}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);