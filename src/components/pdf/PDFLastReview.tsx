import { Text, View, Svg, Path } from "@react-pdf/renderer";
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

const WeatherIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "sunny":
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            fill="#fbbf24"
            d="M12 17a5 5 0 100-10 5 5 0 000 10zm0-2a3 3 0 110-6 3 3 0 010 6zM11 3v2h2V3h-2zm0 16v2h2v-2h-2zm9-9h2v2h-2V10zM2 10h2v2H2v-2zm14.364-3.95l1.414 1.414L16.07 9.172 14.656 7.758l1.414-1.414zM7.758 16.07l1.414 1.414-1.414 1.414-1.414-1.414 1.414-1.414zM16.07 14.656l1.414 1.414-1.414 1.414-1.414-1.414 1.414-1.414zM7.758 7.758L6.344 6.344 4.93 7.758l1.414 1.414 1.414-1.414z"
          />
        </Svg>
      );
    case "cloudy":
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            fill="#9ca3af"
            d="M17 21H7a5 5 0 01-1-9.9V11a7 7 0 1114 0v.1a5 5 0 01-1 9.9zm0-2a3 3 0 100-6h-1v-1a5 5 0 00-10 0v1H5a3 3 0 100 6h12z"
          />
        </Svg>
      );
    case "stormy":
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            fill="#ef4444"
            d="M17 18a5 5 0 00-10 0h2a3 3 0 116 0h2zm-4-9h3l-5 7h3l-5 7v-7h3l-5-7h6z"
          />
        </Svg>
      );
    default:
      return null;
  }
};

const ProgressArrow = ({ type }: { type: string }) => {
  switch (type) {
    case "better":
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            fill="#22c55e"
            d="M12 3l7 7h-4v11h-6V10H5l7-7z"
          />
        </Svg>
      );
    case "worse":
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            fill="#ef4444"
            d="M12 21l-7-7h4V3h6v11h4l-7 7z"
          />
        </Svg>
      );
    default:
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            fill="#9ca3af"
            d="M5 12h14M12 5l7 7-7 7"
          />
        </Svg>
      );
  }
};

export const PDFLastReview = ({ review }: PDFLastReviewProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Dernière revue</Text>
    <View style={styles.reviewHeader}>
      <View style={styles.weatherIcon}>
        <WeatherIcon type={review.weather} />
        <Text style={styles.weatherLabel}>{statusLabels[review.weather]}</Text>
      </View>
      <View style={styles.progressIcon}>
        <ProgressArrow type={review.progress} />
        <Text style={styles.progressLabel}>{progressLabels[review.progress]}</Text>
      </View>
      <Text style={styles.reviewDate}>
        {new Date(review.created_at).toLocaleDateString("fr-FR")}
      </Text>
    </View>
    {review.comment && (
      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>Commentaires</Text>
        <Text style={styles.comment}>{review.comment}</Text>
      </View>
    )}
  </View>
);