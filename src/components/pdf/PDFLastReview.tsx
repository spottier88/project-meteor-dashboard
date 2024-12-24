import { Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";
import { statusLabels, progressLabels } from "./PDFLabels";

interface PDFLastReviewProps {
  review: {
    created_at: string;
    weather: keyof typeof statusLabels;
    progress: keyof typeof progressLabels;
    comment?: string;
  };
}

export const PDFLastReview = ({ review }: PDFLastReviewProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Dernière revue</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Date</Text>
      <Text style={styles.value}>
        {new Date(review.created_at).toLocaleDateString("fr-FR")}
      </Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Météo</Text>
      <Text style={styles.value}>{statusLabels[review.weather]}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>État d'évolution</Text>
      <Text style={styles.value}>{progressLabels[review.progress]}</Text>
    </View>
    {review.comment && (
      <View style={styles.row}>
        <Text style={styles.label}>Commentaires</Text>
        <Text style={styles.value}>{review.comment}</Text>
      </View>
    )}
  </View>
);