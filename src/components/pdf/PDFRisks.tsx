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
  // Group risks by impact level
  const groupedRisks = risks.reduce((acc, risk) => {
    const impact = getImpactLevel(risk.probability, risk.severity);
    if (!acc[impact]) acc[impact] = [];
    acc[impact].push(risk);
    return acc;
  }, {} as Record<string, Risk[]>);

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Risques ({risks.length})</Text>
      {risks.length === 0 ? (
        <Text style={styles.noDataText}>Aucun risque identifié</Text>
      ) : (
        <View style={styles.riskColumns}>
          {Object.entries(groupedRisks).map(([impact, impactRisks]) => (
            <View key={impact} style={styles.riskColumn}>
              <Text style={styles.riskColumnTitle}>
                {impact === "critical" ? "Critiques" : impact === "high" ? "Élevés" : "Modérés"}
                {" "}({impactRisks.length})
              </Text>
              <View style={styles.riskCards}>
                {impactRisks.map((risk, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.riskCard,
                      impact === "critical" && styles.criticalRiskCard,
                      impact === "high" && styles.highRiskCard,
                      impact === "medium" && styles.mediumRiskCard,
                    ]}
                  >
                    <Text style={styles.riskDescription}>{risk.description}</Text>
                    <View style={styles.riskMetadata}>
                      <Text style={styles.riskMetadataText}>
                        Probabilité: {riskLabels.probability[risk.probability]}
                      </Text>
                      <Text style={styles.riskMetadataText}>
                        Gravité: {riskLabels.severity[risk.severity]}
                      </Text>
                      <Text style={[
                        styles.riskStatus,
                        risk.status === "open" && styles.statusOpen,
                        risk.status === "in_progress" && styles.statusInProgress,
                        risk.status === "resolved" && styles.statusResolved,
                      ]}>
                        {riskLabels.status[risk.status]}
                      </Text>
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
            </View>
          ))}
        </View>
      )}
    </View>
  );
};