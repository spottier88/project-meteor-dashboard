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
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Risques ({risks.length})</Text>
    {risks.map((risk, index) => {
      const isCritical =
        risk.probability === "high" && risk.severity === "high" && risk.status !== "resolved";
      return (
        <View key={index} style={[styles.risk, isCritical && styles.criticalRisk]}>
          <Text style={styles.riskTitle}>{risk.description}</Text>
          <Text style={styles.riskDetail}>
            Probabilité: {riskLabels.probability[risk.probability]}
          </Text>
          <Text style={styles.riskDetail}>
            Gravité: {riskLabels.severity[risk.severity]}
          </Text>
          <View style={styles.row}>
            <Text style={styles.riskDetail}>Statut: </Text>
            <View
              style={[
                styles.statusBadge,
                risk.status === "open" && styles.statusOpen,
                risk.status === "in_progress" && styles.statusInProgress,
                risk.status === "resolved" && styles.statusResolved,
              ]}
            >
              <Text>{riskLabels.status[risk.status]}</Text>
            </View>
          </View>
          {risk.mitigation_plan && (
            <Text style={styles.riskDetail}>
              Plan de mitigation: {risk.mitigation_plan}
            </Text>
          )}
        </View>
      );
    })}
  </View>
);