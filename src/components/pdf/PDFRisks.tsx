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

export const PDFRisks = ({ risks }: PDFRisksProps) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>Risques ({risks.length})</Text>
    {risks.length === 0 ? (
      <Text style={styles.noDataText}>Aucun risque identifié</Text>
    ) : (
      <View style={styles.risksGrid}>
        {risks.map((risk, index) => {
          const isCritical =
            risk.probability === "high" && risk.severity === "high" && risk.status !== "resolved";
          return (
            <View key={index} style={[styles.riskCard, isCritical && styles.criticalRisk]} wrap={false}>
              <View style={styles.riskTitleContainer}>
                <Text style={styles.riskTitle}>{risk.description}</Text>
              </View>
              <View style={styles.riskDetailsContainer}>
                <View style={styles.riskDetailItem}>
                  <View style={styles.riskLabelContainer}>
                    <Text style={styles.riskLabel}>Probabilité:</Text>
                  </View>
                  <View style={styles.riskValueContainer}>
                    <Text style={styles.riskValue}>
                      {riskLabels.probability[risk.probability]}
                    </Text>
                  </View>
                </View>
                <View style={styles.riskDetailItem}>
                  <View style={styles.riskLabelContainer}>
                    <Text style={styles.riskLabel}>Gravité:</Text>
                  </View>
                  <View style={styles.riskValueContainer}>
                    <Text style={styles.riskValue}>
                      {riskLabels.severity[risk.severity]}
                    </Text>
                  </View>
                </View>
                <View style={styles.riskDetailItem}>
                  <View style={styles.riskLabelContainer}>
                    <Text style={styles.riskLabel}>Statut:</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      risk.status === "open" && styles.statusOpen,
                      risk.status === "in_progress" && styles.statusInProgress,
                      risk.status === "resolved" && styles.statusResolved,
                    ]}
                  >
                    <Text style={styles.statusText}>{riskLabels.status[risk.status]}</Text>
                  </View>
                </View>
              </View>
              {risk.mitigation_plan && (
                <View style={styles.mitigationPlanContainer}>
                  <View style={styles.riskLabelContainer}>
                    <Text style={styles.riskLabel}>Plan de mitigation:</Text>
                  </View>
                  <View style={styles.riskValueContainer}>
                    <Text style={styles.mitigationPlanText}>{risk.mitigation_plan}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    )}
  </View>
);