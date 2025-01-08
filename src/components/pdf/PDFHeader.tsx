import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

interface PDFHeaderProps {
  title: string;
}

export const PDFHeader = ({ title }: PDFHeaderProps) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.headerDate}>
      {new Date().toLocaleDateString("fr-FR")}
    </Text>
  </View>
);