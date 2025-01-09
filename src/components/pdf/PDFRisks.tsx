import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { riskLabels } from "./PDFLabels";

interface Risk {
  description: string;
  probability: keyof typeof riskLabels.probability;
  severity: keyof typeof riskLabels.severity;
  status: keyof typeof riskLabels.status;
  mitigation_plan?: string;
}

interface PDFRisksProps {
  risks: Risk[];
}

const getImpactLevel = (probability: keyof typeof riskLabels.probability, severity: keyof typeof riskLabels.severity) => {
  const levels = { low: 1, medium: 2, high: 3 };
  const impact = levels[probability] * levels[severity];
  if (impact >= 6) return "critical";
  if (impact >= 3) return "high";
  return "medium";
};

export const PDFRisks = ({ risks }: PDFRisksProps) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>Risques ({risks.length})</Text>
    {risks.length === 0 ? (
      <Text style={styles.noDataText}>Aucun risque identifié</Text>
    ) : (
      <View style={styles.riskCardsContainer}>
        {risks.map((risk, index) => {
          const impactLevel = getImpactLevel(risk.probability, risk.severity);
          return (
            <View 
              key={index} 
              style={[
                styles.riskCard,
                impactLevel === "critical" && styles.criticalRiskCard,
                impactLevel === "high" && styles.highRiskCard,
                impactLevel === "medium" && styles.mediumRiskCard,
              ]} 
              wrap={false}
            >
              <View style={styles.riskHeader}>
                <View style={styles.riskTitleContainer}>
                  <Text style={styles.riskTitle}>{risk.description}</Text>
                </View>
                <View style={[
                  styles.riskStatusBadge,
                  risk.status === "open" && styles.statusOpen,
                  risk.status === "in_progress" && styles.statusInProgress,
                  risk.status === "resolved" && styles.statusResolved,
                ]}>
                  <Text style={styles.riskStatusText}>
                    {riskLabels.status[risk.status]}
                  </Text>
                </View>
              </View>
              
              <View style={styles.riskMetrics}>
                <Text style={styles.riskMetricText}>
                  Impact: {impactLevel === "critical" ? "Critique" : impactLevel === "high" ? "Élevé" : "Modéré"}
                </Text>
                <Text style={styles.riskMetricText}>
                  Probabilité: {riskLabels.probability[risk.probability]}
                </Text>
                <Text style={styles.riskMetricText}>
                  Gravité: {riskLabels.severity[risk.severity]}
                </Text>
              </View>

              {risk.mitigation_plan && (
                <View style={styles.mitigationContainer}>
                  <Text style={styles.mitigationLabel}>Plan de mitigation:</Text>
                  <Text style={styles.mitigationText}>{risk.mitigation_plan}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    )}
  </View>
);