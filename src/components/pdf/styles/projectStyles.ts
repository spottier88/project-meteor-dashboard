import { Styles } from "@react-pdf/renderer";

export const projectStyles: Styles = {
  projectHeader: {
    marginBottom: 15,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  projectDescription: {
    fontSize: 12,
    color: "#666666",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  infoItem: {
    flex: 1,
    minWidth: 200,
  },
};