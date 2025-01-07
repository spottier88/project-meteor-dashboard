import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#6CB33F",
    padding: 10,
    marginBottom: 0,
  },
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
  situationRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#4B5563",
    color: "white",
  },
  situationCell: {
    padding: 10,
    flex: 1,
    fontSize: 12,
    borderRight: 1,
    borderColor: "#e5e7eb",
  },
  mainContent: {
    flexDirection: "row",
    flex: 1,
  },
  leftColumn: {
    flex: 1,
    padding: 10,
    borderRight: 1,
    borderColor: "#e5e7eb",
  },
  rightColumn: {
    flex: 1,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "#111827",
    color: "white",
    padding: 8,
    marginBottom: 10,
  },
  contentText: {
    fontSize: 11,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bullet: {
    width: 10,
    fontSize: 11,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    paddingLeft: 5,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 10,
    color: "#666666",
    textAlign: "right",
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 10,
    color: "#ffffff",
    textAlign: "center",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  // Status colors
  statusOpen: {
    backgroundColor: "#ef4444",
  },
  statusInProgress: {
    backgroundColor: "#f59e0b",
  },
  statusResolved: {
    backgroundColor: "#10b981",
  },
});