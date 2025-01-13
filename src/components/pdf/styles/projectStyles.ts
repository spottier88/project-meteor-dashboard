import { Styles } from "@react-pdf/renderer";

export const projectStyles: Styles = {
  projectHeader: {
    marginBottom: 15,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 12,
    lineHeight: 1.4,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: 180,
    marginBottom: 8,
  },
};