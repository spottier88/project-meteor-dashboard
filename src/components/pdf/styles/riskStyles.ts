import { Styles } from "@react-pdf/renderer";

export const riskStyles: Styles = {
  riskColumns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  riskColumn: {
    flex: 1,
    gap: 8,
  },
  riskColumnTitle: {
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "#F3F4F6",
    padding: 5,
    borderRadius: 4,
  },
  riskCards: {
    gap: 8,
  },
  riskCard: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
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
  riskDescription: {
    fontSize: 12,
    marginBottom: 6,
  },
  riskMetadata: {
    gap: 4,
    marginTop: 4,
  },
  riskMetadataText: {
    fontSize: 10,
    color: "#4B5563",
  },
  riskStatus: {
    fontSize: 10,
    marginTop: 4,
    padding: "2 6",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  statusOpen: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  statusInProgress: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },
  statusResolved: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
  },
  mitigationPlan: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  mitigationLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4B5563",
  },
  mitigationText: {
    fontSize: 10,
    color: "#1F2937",
    marginTop: 2,
  },
};