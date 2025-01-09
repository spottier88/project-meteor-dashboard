import { Style } from "@react-pdf/renderer";

export const projectStyles: Record<string, Style> = {
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