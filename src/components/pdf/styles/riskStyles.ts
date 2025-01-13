import { Styles } from "@react-pdf/renderer";

export const riskStyles: Styles = {
  section: {
    marginVertical: 10,
    padding: 0,
  },
  emptyText: {
    fontSize: 10,
    color: "#666666",
    marginTop: 5,
    fontStyle: "italic",
  },
  riskContainer: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  riskGroup: {
    marginBottom: 10,
  },
  riskGroupTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    backgroundColor: "#F3F4F6",
    padding: "4 8",
    borderRadius: 4,
  },
  riskItem: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderLeft: "3 solid #E5E7EB",
  },
  criticalRisk: {
    borderLeft: "3 solid #DC2626",
    backgroundColor: "#FEF2F2",
  },
  highRisk: {
    borderLeft: "3 solid #D97706",
    backgroundColor: "#FEF3C7",
  },
  mediumRisk: {
    borderLeft: "3 solid #0284C7",
    backgroundColor: "#E0F2FE",
  },
  riskDescription: {
    fontSize: 10,
    marginBottom: 6,
    fontWeight: "bold",
  },
  riskDetails: {
    marginTop: 4,
  },
  riskDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  riskDetailLabel: {
    fontSize: 8,
    color: "#4B5563",
    marginRight: 4,
    width: "25%",
  },
  riskDetailValue: {
    fontSize: 8,
    flex: 1,
  },
  riskStatus: {
    fontSize: 8,
    padding: "2 6",
    borderRadius: 3,
  },
  statusOpen: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  statusIn_progress: {
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
    fontSize: 8,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 2,
  },
  mitigationText: {
    fontSize: 8,
    color: "#1F2937",
  },
};