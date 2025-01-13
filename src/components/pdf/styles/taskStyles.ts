import { Styles } from "@react-pdf/renderer";

export const taskStyles: Styles = {
  kanbanBoard: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    flexWrap: "wrap",
  },
  taskColumn: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  taskColumnTitle: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 8,
    fontWeight: "bold",
  },
  task: {
    backgroundColor: "white",
    padding: 6,
    marginBottom: 6,
    borderRadius: 4,
  },
  taskTitle: {
    fontSize: 10,
    color: "#1a1a1a",
    lineHeight: 1.4,
  },
};