import { Styles } from "@react-pdf/renderer";

export const riskStyles: Styles = {
  riskColumns: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
    flexWrap: "wrap",
  },
  riskColumn: {
    flex: 1,
    gap: 10,
    minWidth: "30%",
    marginBottom: 10,
  },
  riskColumnTitle: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#F3F4F6",
    padding: "5 8",
    borderRadius: 4,
    marginBottom: 8,
    width: "100%",
  },
  riskCards: {
    gap: 12,
    width: "100%",
  },
  riskCard: {
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#F9FAFB",
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
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
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.4,
    width: "100%",
  },
  riskMetadata: {
    gap: 4,
    marginTop: 6,
    width: "100%",
  },
  riskMetadataText: {
    fontSize: 8,
    color: "#4B5563",
    lineHeight: 1.4,
    width: "100%",
  },
  riskStatus: {
    fontSize: 8,
    marginTop: 6,
    padding: "3 8",
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    width: "100%",
  },
  mitigationLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 4,
  },
  mitigationText: {
    fontSize: 8,
    color: "#1F2937",
    lineHeight: 1.4,
    width: "100%",
  },
};