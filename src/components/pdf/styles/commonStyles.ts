import { Style } from "@react-pdf/renderer";

export const commonStyles: Record<string, Style> = {
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
  situationRow: {
    marginBottom: 10,
    backgroundColor: "#E5E7EB",
    padding: 5,
  },
  situationText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
};