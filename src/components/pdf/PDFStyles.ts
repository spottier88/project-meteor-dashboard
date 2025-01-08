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
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: "#1a1a1a",
    backgroundColor: "#E5E7EB",
    padding: 5,
  },
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
  label: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    color: "#1a1a1a",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  weatherIcon: {
    alignItems: "center",
  },
  weatherLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  progressIcon: {
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#666666",
  },
  commentSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  comment: {
    fontSize: 11,
    color: "#666666",
  },
  kanbanBoard: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
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

  risksGrid: {
    gap: 10,
    marginTop: 5,
    width: "100%",
  },
  riskCard: {
    backgroundColor: "#F3F4F6",
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
    width: "100%",
  },
  criticalRisk: {
    backgroundColor: "#FEE2E2",
  },
  riskTitleContainer: {
    marginBottom: 8,
    width: "100%",
  },
  riskTitle: {
    fontSize: 12,
    fontWeight: "bold",
  },
  riskDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 15,
    width: "100%",
  },
  riskDetailItem: {
    flex: 1,
    minWidth: "30%",
  },
  riskLabelContainer: {
    marginBottom: 2,
  },
  riskValueContainer: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 10,
    color: "#666666",
  },
  riskValue: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  statusBadge: {
    padding: 4,
    borderRadius: 2,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
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
  mitigationPlanContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    width: "100%",
  },
  mitigationPlanText: {
    fontSize: 10,
    color: "#1a1a1a",
    marginTop: 2,
  },
  noDataText: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
    marginTop: 5,
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
