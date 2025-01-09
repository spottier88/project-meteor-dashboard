import { Style } from "@react-pdf/renderer";

export const riskStyles: Record<string, Style> = {
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
};