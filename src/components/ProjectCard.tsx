import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Cloud, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectStatus = "sunny" | "cloudy" | "stormy";
export type ProgressStatus = "better" | "stable" | "worse";

interface ProjectCardProps {
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
}

const statusIcons = {
  sunny: { icon: Sun, color: "text-warning" },
  cloudy: { icon: Cloud, color: "text-neutral" },
  stormy: { icon: CloudLightning, color: "text-danger" },
};

const progressColors = {
  better: "text-success",
  stable: "text-neutral",
  worse: "text-danger",
};

export const ProjectCard = ({
  title,
  status,
  progress,
  completion,
  lastReviewDate,
}: ProjectCardProps) => {
  const StatusIcon = statusIcons[status].icon;

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <StatusIcon className={cn("w-6 h-6", statusIcons[status].color)} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className={cn("text-sm font-medium", progressColors[progress])}>
              {progress.charAt(0).toUpperCase() + progress.slice(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completion</span>
            <span className="text-sm font-medium">{completion}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Review</span>
            <span className="text-sm font-medium">{lastReviewDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};