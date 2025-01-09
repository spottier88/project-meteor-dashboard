import { Style } from "@react-pdf/renderer";

export const reviewStyles: Record<string, Style> = {
  reviewHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 15,
  },
  weatherIcon: {
    alignItems: "center" as const,
  },
  weatherLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  progressIcon: {
    alignItems: "center" as const,
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
    padding: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  commentLabel: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 4,
  },
  comment: {
    fontSize: 12,
    color: "#1a1a1a",
  },
};