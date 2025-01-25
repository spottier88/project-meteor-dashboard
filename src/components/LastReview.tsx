import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Cloud, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";

interface LastReviewProps {
  review: {
    weather: "sunny" | "cloudy" | "stormy";
    progress: "better" | "stable" | "worse";
    comment?: string;
    created_at: string;
  } | null;
}

const weatherIcons = {
  sunny: { icon: Sun, color: "text-warning", label: "Ensoleillé" },
  cloudy: { icon: Cloud, color: "text-neutral", label: "Nuageux" },
  stormy: { icon: CloudLightning, color: "text-danger", label: "Orageux" },
};

const progressColors = {
  better: "text-success",
  stable: "text-neutral",
  worse: "text-danger",
};

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
};

export const LastReview = ({ review }: LastReviewProps) => {
  if (!review) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Dernière revue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">Aucune revue disponible</p>
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = weatherIcons[review.weather].icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Dernière revue</span>
          <span className="text-sm text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("fr-FR")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <WeatherIcon className={cn("w-24 h-24", weatherIcons[review.weather].color)} />
        </div>
        <div className="text-center">
          <p className={cn("text-lg font-medium", progressColors[review.progress])}>
            {progressLabels[review.progress]}
          </p>
        </div>
        {review.comment && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};