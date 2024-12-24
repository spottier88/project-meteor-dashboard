import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

export const PDFFooter = () => (
  <View style={styles.footer}>
    <Text>
      Document généré le {new Date().toLocaleDateString("fr-FR")} à{" "}
      {new Date().toLocaleTimeString("fr-FR")}
    </Text>
  </View>
);