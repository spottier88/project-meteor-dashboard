import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    orientation: "landscape",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#6B9E46",
    padding: 15,
    marginBottom: 20,
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
    backgroundColor: "#4A4A4A",
    padding: 10,
    marginBottom: 20,
  },
  situationText: {
    color: "white",
    fontSize: 16,
  },
  mainContent: {
    flexDirection: "row",
    gap: 20,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: "#1a1a1a",
    backgroundColor: "#E5E7EB",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  label: {
    width: 120,
    color: "#666666",
    fontSize: 12,
  },
  value: {
    flex: 1,
    fontSize: 12,
    color: "#1a1a1a",
  },
  kanbanBoard: {
    flexDirection: "row",
    gap: 10,
  },
  taskColumn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 4,
  },
  taskColumnTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#374151",
  },
  task: {
    backgroundColor: "white",
    padding: 6,
    marginBottom: 4,
    borderRadius: 2,
  },
  taskTitle: {
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: "#666666",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});