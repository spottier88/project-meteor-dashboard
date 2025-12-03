import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Cloud, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";

interface LastReviewProps {
  review: {
    weather: "sunny" | "cloudy" | "stormy";
    progress: "better" | "stable" | "worse";
    comment?: string;
    difficulties?: string;
    created_at: string;
  } | null;
  /** Revue précédente pour afficher la météo antérieure en petite icône */
  previousReview?: {
    weather: "sunny" | "cloudy" | "stormy";
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

export const LastReview = ({ review, previousReview }: LastReviewProps) => {
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
  const PreviousWeatherIcon = previousReview ? weatherIcons[previousReview.weather].icon : null;

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
        <div className="flex items-center justify-center relative">
          <WeatherIcon className={cn("w-24 h-24", weatherIcons[review.weather].color)} />
          {/* Icône de la météo de la revue précédente - petite, en coin supérieur gauche */}
          {previousReview && PreviousWeatherIcon && (
            <div 
              className="absolute -top-1 -left-1 bg-background rounded-full p-1 shadow-sm border"
              title={`Revue précédente : ${weatherIcons[previousReview.weather].label}`}
            >
              <PreviousWeatherIcon className={cn("w-5 h-5", weatherIcons[previousReview.weather].color)} />
            </div>
          )}
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
        {review.difficulties && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-orange-500">Difficultés en cours</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.difficulties}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};