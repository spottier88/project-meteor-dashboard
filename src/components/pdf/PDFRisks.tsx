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

export const PDFRisks = ({ risks }: PDFRisksProps) => {
  if (risks.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risques</Text>
        <Text style={styles.emptyText}>Aucun risque identifié pour ce projet</Text>
      </View>
    );
  }

  const groupedRisks = risks.reduce((acc, risk) => {
    const impact = getImpactLevel(risk.probability, risk.severity);
    if (!acc[impact]) acc[impact] = [];
    acc[impact].push(risk);
    return acc;
  }, {} as Record<string, Risk[]>);

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Risques ({risks.length})</Text>
      <View style={styles.riskContainer}>
        {Object.entries(groupedRisks).map(([impact, impactRisks]) => (
          <View key={impact} style={styles.riskGroup}>
            <Text style={styles.riskGroupTitle}>
              {impact === "critical" ? "Critiques" : impact === "high" ? "Élevés" : "Modérés"}
              {" "}({impactRisks.length})
            </Text>
            {impactRisks.map((risk, index) => (
              <View 
                key={index} 
                style={[
                  styles.riskItem,
                  impact === "critical" && styles.criticalRisk,
                  impact === "high" && styles.highRisk,
                  impact === "medium" && styles.mediumRisk,
                ]}
              >
                <Text style={styles.riskDescription}>{risk.description}</Text>
                <View style={styles.riskDetails}>
                  <View style={styles.riskDetailRow}>
                    <Text style={styles.riskDetailLabel}>Probabilité:</Text>
                    <Text style={styles.riskDetailValue}>
                      {riskLabels.probability[risk.probability]}
                    </Text>
                  </View>
                  <View style={styles.riskDetailRow}>
                    <Text style={styles.riskDetailLabel}>Gravité:</Text>
                    <Text style={styles.riskDetailValue}>
                      {riskLabels.severity[risk.severity]}
                    </Text>
                  </View>
                  <View style={styles.riskDetailRow}>
                    <Text style={styles.riskDetailLabel}>Statut:</Text>
                    <Text style={[
                      styles.riskStatus,
                      styles[`status${risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}`]
                    ]}>
                      {riskLabels.status[risk.status]}
                    </Text>
                  </View>
                </View>
                {risk.mitigation_plan && (
                  <View style={styles.mitigationPlan}>
                    <Text style={styles.mitigationLabel}>Plan de mitigation:</Text>
                    <Text style={styles.mitigationText}>{risk.mitigation_plan}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};