import { StyleSheet } from "@react-pdf/renderer";
import { commonStyles } from "./styles/commonStyles";
import { textStyles } from "./styles/textStyles";
import { riskStyles } from "./styles/riskStyles";
import { projectStyles } from "./styles/projectStyles";
import { reviewStyles } from "./styles/reviewStyles";
import { taskStyles } from "./styles/taskStyles";
import { footerStyles } from "./styles/footerStyles";

export const styles = StyleSheet.create({
  ...commonStyles,
  ...textStyles,
  ...riskStyles,
  ...projectStyles,
  ...reviewStyles,
  ...taskStyles,
  ...footerStyles,
});