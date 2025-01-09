import { StyleSheet } from "@react-pdf/renderer";

// Common styles
const commonStyles = {
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    orientation: "landscape" as const,
  },
  header: {
    flexDirection: "row" as const,
    backgroundColor: "#6B9E46",
    padding: 15,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    gap: 20,
  },
  section: {
    marginBottom: 15,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 4,
  },
};

// Text styles
const textStyles = {
  headerTitle: {
    color: "white",
    fontSize: 24,
    flex: 1,
  },
  headerDate: {
    color: "white",
    fontSize: 14,
    alignSelf: "center" as const,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: "#1a1a1a",
    backgroundColor: "#E5E7EB",
    padding: 5,
  },
  noDataText: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
    marginTop: 5,
  },
};

// Risk card styles
const riskStyles = {
  riskCardsContainer: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 10,
  },
  riskCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
  },
  criticalRiskCard: {
    backgroundColor: "#FEE2E2",
    borderLeft: "4 solid #DC2626",
  },
  highRiskCard: {
    backgroundColor: "#FEF3C7",
    borderLeft: "4 solid #D97706",
  },
  mediumRiskCard: {
    backgroundColor: "#E0F2FE",
    borderLeft: "4 solid #0284C7",
  },
  riskHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  riskTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  riskTitle: {
    fontSize: 12,
    fontWeight: "bold" as const,
  },
  riskStatusBadge: {
    padding: "4 8",
    borderRadius: 4,
    alignSelf: "flex-start" as const,
  },
  riskStatusText: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  statusOpen: {
    backgroundColor: "#FEE2E2",
  },
  statusInProgress: {
    backgroundColor: "#FEF3C7",
  },
  statusResolved: {
    backgroundColor: "#D1FAE5",
  },
  riskMetrics: {
    marginTop: 8,
    marginBottom: 8,
  },
  riskMetricText: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 4,
  },
  mitigationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  mitigationLabel: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 4,
  },
  mitigationText: {
    fontSize: 10,
    color: "#1a1a1a",
  },
};

// Project info styles
const projectStyles = {
  projectHeader: {
    marginBottom: 15,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 5,
  },
  projectDescription: {
    fontSize: 12,
    color: "#666666",
  },
  infoGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 20,
  },
  infoItem: {
    flex: 1,
    minWidth: 200,
  },
};

// Review styles
const reviewStyles = {
  reviewHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 15,
  },
  weatherIcon: {
    alignItems: "center" as const,
  },
  weatherLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  progressIcon: {
    alignItems: "center" as const,
  },
  progressLabel: {
    fontSize: 10,
    marginTop: 4,
  },
};

// Footer styles
const footerStyles = {
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: "#666666",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
};

// Combine all styles
export const styles = StyleSheet.create({
  ...commonStyles,
  ...textStyles,
  ...riskStyles,
  ...projectStyles,
  ...reviewStyles,
  ...footerStyles,
});