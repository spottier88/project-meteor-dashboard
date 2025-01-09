import { Styles } from "@react-pdf/renderer";

export const reviewStyles: Styles = {
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