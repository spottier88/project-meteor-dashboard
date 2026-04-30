/**
 * @file MyTasksCalendar.tsx
 * @description Vue calendrier mensuel pour la page "Mes tâches".
 * Affiche les tâches sur une grille mensuelle selon leur période (start_date / due_date).
 * - start_date uniquement : badge teal sur le jour de début
 * - start_date + due_date : badge purple sur toute la période
 * - due_date uniquement   : badge orange sur le jour d'échéance
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarTask {
  id: string;
  title: string;
  status: string;
  start_date?: string | null;
  due_date?: string | null;
  projects?: {
    title?: string;
  } | null;
}

interface MyTasksCalendarProps {
  tasks: CalendarTask[];
  onEdit: (task: CalendarTask) => void;
}

type TaskScenario = "start_only" | "period" | "due_only";

interface TaskWithScenario {
  task: CalendarTask;
  scenario: TaskScenario;
  isStart: boolean;
  isEnd: boolean;
}

const scenarioColors: Record<TaskScenario, string> = {
  start_only: "bg-teal-500",
  period:     "bg-purple-500",
  due_only:   "bg-orange-500",
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const getRoundingClass = (item: TaskWithScenario, dateStr: string): string => {
  if (item.scenario !== "period") return "rounded";
  const dayOfWeek = new Date(dateStr + "T12:00:00").getDay(); // 0=dim, 1=lun
  const isWeekEnd = dayOfWeek === 0;
  const isWeekStart = dayOfWeek === 1;

  const roundLeft = item.isStart || isWeekStart;
  const roundRight = item.isEnd || isWeekEnd;

  if (roundLeft && roundRight) return "rounded";
  if (roundLeft)  return "rounded-l rounded-r-none";
  if (roundRight) return "rounded-r rounded-l-none";
  return "rounded-none";
};

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

  // Retourne les tâches à afficher pour un jour donné, avec leur scénario
  const getTasksForDate = (dateStr: string): TaskWithScenario[] => {
    const result: TaskWithScenario[] = [];
    tasks.forEach(task => {
      const start = task.start_date?.split("T")[0];
      const due = task.due_date?.split("T")[0];

      if (start && due) {
        if (dateStr >= start && dateStr <= due) {
          result.push({ task, scenario: "period", isStart: dateStr === start, isEnd: dateStr === due });
        }
      } else if (start && !due) {
        if (dateStr === start) {
          result.push({ task, scenario: "start_only", isStart: true, isEnd: true });
        }
      } else if (!start && due) {
        if (dateStr === due) {
          result.push({ task, scenario: "due_only", isStart: true, isEnd: true });
        }
      }
    });
    return result;
  };

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
        <Button variant="outline" size="icon" onClick={() => void navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {MONTHS[month]} {year}
        </h3>
        <Button variant="outline" size="icon" onClick={() => void navigate(1)}>
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
          const dayTasks = dateStr ? getTasksForDate(dateStr) : [];
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
                    {dayTasks.map(item => (
                      <div
                        key={item.task.id}
                        className={cn(
                          "px-1 py-0.5 cursor-pointer text-white truncate hover:opacity-80",
                          scenarioColors[item.scenario],
                          getRoundingClass(item, dateStr!)
                        )}
                        title={`${item.task.title} — ${item.task.projects?.title || ""} (${item.task.status})`}
                        onClick={() => onEdit(item.task)}
                      >
                        {item.task.title}
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
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Date de début uniquement</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Période (début → échéance)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Date d'échéance uniquement</span>
      </div>
    </div>
  );
};
