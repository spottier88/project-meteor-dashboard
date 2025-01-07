import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: "#1a1a1a",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
  risk: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  riskTitle: {
    fontSize: 14,
    marginBottom: 5,
    color: "#1a1a1a",
  },
  riskDetail: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 3,
  },
  criticalRisk: {
    backgroundColor: "#fee2e2",
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
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 12,
    color: "#ffffff",
    textAlign: "center",
    width: "auto",
  },
  statusOpen: {
    backgroundColor: "#ef4444",
  },
  statusInProgress: {
    backgroundColor: "#f59e0b",
  },
  statusResolved: {
    backgroundColor: "#10b981",
  },

  // Styles pour les tâches
  kanbanBoard: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  taskColumn: {
    flex: 1,
    gap: 5,
  },
  taskColumnTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#666",
  },
  task: {
    padding: 5,
    marginBottom: 5,
    backgroundColor: "#f8f9fa",
    borderRadius: 3,
  },
  taskTitle: {
    fontSize: 10,
    fontWeight: "bold",
  },
  taskDescription: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  taskAssignee: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  taskDueDate: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
});
