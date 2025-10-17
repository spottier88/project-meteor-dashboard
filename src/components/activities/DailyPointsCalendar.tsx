/**
 * @component DailyPointsCalendar
 * @description Calendrier hebdomadaire affichant les points par jour
 */
import React from "react";
import { startOfWeek, addDays, isSameDay } from "date-fns";
import { DayPointsCell } from "./DayPointsCell";

interface DailyPointsCalendarProps {
  weekStartDate: Date;
  pointsByDay: Record<string, number>;
  dailyQuota: number;
  onDayClick: (date: Date) => void;
}

export const DailyPointsCalendar: React.FC<DailyPointsCalendarProps> = ({
  weekStartDate,
  pointsByDay,
  dailyQuota,
  onDayClick,
}) => {
  const today = new Date();
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });

  // Générer les 7 jours de la semaine
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {days.map((day) => {
        const dayKey = day.toISOString().split("T")[0];
        const points = pointsByDay[dayKey] || 0;
        const isToday = isSameDay(day, today);

        return (
          <DayPointsCell
            key={dayKey}
            date={day}
            points={points}
            dailyQuota={dailyQuota}
            isToday={isToday}
            onClick={() => onDayClick(day)}
          />
        );
      })}
    </div>
  );
};