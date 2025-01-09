import { Style } from "@react-pdf/renderer";

export const taskStyles: Record<string, Style> = {
  kanbanBoard: {
    flexDirection: "row" as const,
    gap: 20,
    marginTop: 10,
  },
  taskColumn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 4,
  },
  taskColumnTitle: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 10,
  },
  task: {
    backgroundColor: "white",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  taskTitle: {
    fontSize: 12,
    color: "#1a1a1a",
  },
};