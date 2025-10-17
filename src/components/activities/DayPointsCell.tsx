/**
 * @component DayPointsCell
 * @description Cellule représentant les points d'un jour spécifique avec indicateurs visuels
 */
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PointsVisualization } from "./PointsVisualization";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayPointsCellProps {
  date: Date;
  points: number;
  dailyQuota: number;
  isToday?: boolean;
  onClick?: () => void;
}

export const DayPointsCell: React.FC<DayPointsCellProps> = ({
  date,
  points,
  dailyQuota,
  isToday = false,
  onClick,
}) => {
  const percentageUsed = (points / dailyQuota) * 100;
  const isOverQuota = points > dailyQuota;
  const isComplete = points >= dailyQuota;
  
  // Déterminer la couleur de fond selon le statut
  const getStatusColor = () => {
    if (isOverQuota) return "bg-destructive/10 border-destructive/30";
    if (isComplete) return "bg-success/10 border-success/30";
    if (points > 0) return "bg-amber-50 border-amber-200";
    return "bg-muted/30 border-border";
  };

  return (
    <Card
      className={cn(
        "relative p-3 cursor-pointer transition-all hover:shadow-md",
        getStatusColor(),
        isToday && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      {/* En-tête avec jour */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase">
            {format(date, "EEE", { locale: fr })}
          </div>
          <div className={cn(
            "text-lg font-bold",
            isToday && "text-primary"
          )}>
            {format(date, "d", { locale: fr })}
          </div>
        </div>
        
        {/* Badge Aujourd'hui */}
        {isToday && (
          <Badge variant="default" className="text-xs">
            Aujourd'hui
          </Badge>
        )}
      </div>

      {/* Visualisation des points */}
      <div className="space-y-2">
        <div className="flex items-center justify-center py-2">
          {points > 0 ? (
            <PointsVisualization points={points} size="lg" animated={isToday} />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30">
              <Plus className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Statut */}
        <div className="text-center">
          <div className="text-sm font-semibold">
            {points} / {dailyQuota} pts
          </div>
          <div className="text-xs text-muted-foreground">
            {percentageUsed.toFixed(0)}%
          </div>
        </div>
      </div>
    </Card>
  );
};