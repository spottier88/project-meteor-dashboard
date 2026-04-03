/**
 * @file MyTasksCalendar.tsx
 * @description Vue calendrier mensuel pour la page "Mes tâches".
 * Affiche les tâches sur une grille mensuelle selon leur date d'échéance.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

interface MyTasksCalendarProps {
  tasks: any[];
  onEdit: (task: any) => void;
}

const statusColors: Record<string, string> = {
  todo: "bg-yellow-500",
  in_progress: "bg-blue-500",
  done: "bg-green-500",
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export const MyTasksCalendar = ({ tasks, onEdit }: MyTasksCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculer les jours du mois
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Décaler pour commencer le lundi (0=lun, 6=dim)
  const startOffset = (firstDay.getDay() + 6) % 7;

  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  // Indexer les tâches par date d'échéance
  const tasksByDate: Record<string, any[]> = {};
  tasks.forEach(task => {
    if (task.due_date) {
      const key = task.due_date.split("T")[0];
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(task);
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const navigate = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  return (
    <div>
      {/* Navigation du mois */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {MONTHS[month]} {year}
        </h3>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-px border rounded-lg overflow-hidden bg-border">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const dateStr = isCurrentMonth
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
            : null;
          const dayTasks = dateStr ? (tasksByDate[dateStr] || []) : [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={i}
              className={cn(
                "bg-background min-h-[80px] p-1 text-xs",
                !isCurrentMonth && "bg-muted/30"
              )}
            >
              {isCurrentMonth && (
                <>
                  <div className={cn(
                    "text-right mb-1 font-medium",
                    isToday && "text-primary font-bold"
                  )}>
                    {isToday ? (
                      <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                        {dayNum}
                      </span>
                    ) : dayNum}
                  </div>
                  <div className="space-y-0.5 overflow-y-auto max-h-[60px]">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          "rounded px-1 py-0.5 cursor-pointer text-white truncate hover:opacity-80",
                          statusColors[task.status] || "bg-muted"
                        )}
                        title={`${task.title} — ${task.projects?.title || ""}`}
                        onClick={() => onEdit(task)}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> À faire</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> En cours</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Terminé</span>
      </div>
    </div>
  );
};
