/**
 * @component DailyPointsEntry
 * @description Interface de saisie quotidienne des points avec vue calendaire
 */
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyPointsCalendar } from "./DailyPointsCalendar";
import { PointsEntryForm } from "./PointsEntryForm";
import { useActivityPointsQuota } from "@/hooks/useActivityPointsQuota";
import { useWeeklyPoints } from "@/hooks/useWeeklyPoints";
import { useUser } from "@supabase/auth-helpers-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DailyPointsEntryProps {
  weekStartDate: Date;
}

export const DailyPointsEntry: React.FC<DailyPointsEntryProps> = ({
  weekStartDate,
}) => {
  const user = useUser();
  const { quota } = useActivityPointsQuota();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { points, addPoints, isAddingPoints, totalPointsUsed } = useWeeklyPoints(
    user?.id || "",
    weekStartDate
  );

  // Calculer le quota quotidien suggéré (5 jours ouvrés)
  const dailyQuota = Math.round(quota / 5);
  const pointsRemaining = Math.max(0, quota - totalPointsUsed);

  // Grouper les points par jour
  const pointsByDay = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    points.forEach((point) => {
      if (point.activity_date) {
        const dayKey = point.activity_date;
        grouped[dayKey] = (grouped[dayKey] || 0) + point.points;
      }
    });

    return grouped;
  }, [points]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowForm(true);
  };

  const handleAddPoints = (data: any) => {
    addPoints({
      ...data,
      user_id: user?.id || "",
      activity_date: selectedDate ? selectedDate.toISOString().split("T")[0] : null,
    });
    setShowForm(false);
    setSelectedDate(null);
  };

  const handleQuickAdd = () => {
    setSelectedDate(new Date());
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec résumé */}
      <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Saisie quotidienne</CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                Quota quotidien : {dailyQuota} pts/jour
              </Badge>
              <Badge variant={pointsRemaining > 0 ? "default" : "secondary"}>
                {pointsRemaining} pts restants
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Cliquez sur un jour pour ajouter des points. Le quota est flexible : vous pouvez répartir vos {quota} points hebdomadaires comme vous le souhaitez.
          </p>
          
          <Button onClick={handleQuickAdd} disabled={pointsRemaining === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter points aujourd'hui
          </Button>
        </CardContent>
      </Card>

      {/* Calendrier hebdomadaire */}
      <DailyPointsCalendar
        weekStartDate={weekStartDate}
        pointsByDay={pointsByDay}
        dailyQuota={dailyQuota}
        onDayClick={handleDayClick}
      />

      {/* Formulaire de saisie */}
      <PointsEntryForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleAddPoints}
        isSubmitting={isAddingPoints}
        pointsRemaining={pointsRemaining}
        selectedDate={selectedDate}
        mode="daily"
      />
    </div>
  );
};