import { Styles } from "@react-pdf/renderer";

export const textStyles: Styles = {
  headerTitle: {
    color: "white",
    fontSize: 24,
    flex: 1,
  },
  headerDate: {
    color: "white",
    fontSize: 14,
    alignSelf: "center",
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
  label: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#1a1a1a",
  },
};