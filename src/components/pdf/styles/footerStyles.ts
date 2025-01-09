import { Style } from "@react-pdf/renderer";

export const footerStyles: Record<string, Style> = {
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: "#666666",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
};