import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudLightning, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSheet } from "@/components/ReviewSheet";

interface LastReviewProps {
  review: {
    weather: "sunny" | "cloudy" | "stormy";
    progress: "better" | "stable" | "worse";
    comment?: string;
    created_at: string;
  };
  projectId: string;
  projectTitle: string;
  onReviewSubmitted?: () => void;
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

export const LastReview = ({ review, projectId, projectTitle, onReviewSubmitted }: LastReviewProps) => {
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const WeatherIcon = weatherIcons[review.weather].icon;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>Dernière revue</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("fr-FR")}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsReviewSheetOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle revue
              </Button>
            </div>
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

      <ReviewSheet
        projectId={projectId}
        projectTitle={projectTitle}
        isOpen={isReviewSheetOpen}
        onClose={() => setIsReviewSheetOpen(false)}
        onReviewSubmitted={() => {
          setIsReviewSheetOpen(false);
          onReviewSubmitted?.();
        }}
      />
    </>
  );
};