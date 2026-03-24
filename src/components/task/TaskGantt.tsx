/**
 * @file TaskGantt.tsx
 * @description Composant Gantt pour les tâches d'un projet.
 * Utilise SVAR React Gantt pour le rendu interactif avec drag & drop.
 * Permet la modification des dates par glisser-déposer et l'édition par double-clic.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Gantt, Willow } from '@svar-ui/react-gantt';
import "@svar-ui/react-gantt/all.css";
import "@/styles/gantt.css";
import { Button } from "@/components/ui/button";
import { CalendarDays, CalendarRange, Calendar, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportGanttToExcel } from "@/utils/ganttExcelExport";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { mapTasksToSvarFormat } from '@/utils/gantt-helpers';
import type { ITask, IApi } from '@svar-ui/react-gantt';

interface TaskGanttProps {
  tasks: Array<any>;
  projectId: string;
  onEdit?: (task: any) => void;
  onUpdate?: () => void;
  onExpanderClick?: (task: any) => void;
  isProjectClosed?: boolean;
  projectTitle?: string;
}

/** Configuration des échelles de temps selon le mode de vue */
type ViewModeKey = 'day' | 'week' | 'month' | 'year';

const SCALES_CONFIG: Record<ViewModeKey, Array<{ unit: string; step: number; format: string }>> = {
  day: [
    { unit: 'month', step: 1, format: 'MMMM yyyy' },
    { unit: 'day', step: 1, format: 'd' },
  ],
  week: [
    { unit: 'month', step: 1, format: 'MMMM yyyy' },
    { unit: 'week', step: 1, format: 'dd MMM' },
  ],
  month: [
    { unit: 'year', step: 1, format: 'yyyy' },
    { unit: 'month', step: 1, format: 'MMMM' },
  ],
  year: [
    { unit: 'year', step: 1, format: 'yyyy' },
  ],
};

export const TaskGantt: React.FC<TaskGanttProps> = ({
  tasks,
  projectId,
  onEdit,
  onUpdate,
  onExpanderClick,
  isProjectClosed = false,
  projectTitle,
}) => {
  const [viewMode, setViewMode] = useState<ViewModeKey>('week');
  const [localTasks, setLocalTasks] = useState<Array<any>>(tasks);
  const apiRef = useRef<IApi | null>(null);

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Transformer les tâches au format SVAR
  const svarTasks = mapTasksToSvarFormat(localTasks);

  /**
   * Gère la mise à jour d'une tâche (drag & drop des dates)
   */
  const handleUpdateTask = useCallback(async (ev: { id: string | number; task: Partial<ITask>; inProgress?: boolean }) => {
    // Ignorer les mises à jour intermédiaires (pendant le drag)
    if (ev.inProgress) return;

    const taskId = String(ev.id);
    const updatedFields = ev.task;

    // Si les dates ont changé, persister en base
    if (updatedFields.start || updatedFields.end) {
      try {
        const startDate = updatedFields.start
          ? updatedFields.start.toISOString().split('T')[0]
          : undefined;
        const endDate = updatedFields.end
          ? updatedFields.end.toISOString().split('T')[0]
          : undefined;

        const updatePayload: Record<string, string> = {
          updated_at: new Date().toISOString(),
        };
        if (startDate) updatePayload.start_date = startDate;
        if (endDate) updatePayload.due_date = endDate;

        const { error } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', taskId)
          .select();

        if (error) throw error;

        // Mettre à jour le state local
        setLocalTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? { ...t, ...(startDate && { start_date: startDate }), ...(endDate && { due_date: endDate }) }
              : t
          )
        );

        toast.success('Dates de la tâche mises à jour');
        onUpdate?.();
      } catch (error) {
        logger.error('Erreur lors de la mise à jour des dates: ' + error);
        toast.error("Erreur lors de la mise à jour des dates");
      }
    }
  }, [onUpdate]);

  /**
   * Initialise l'API SVAR pour capturer les événements
   */
  const handleInit = useCallback((api: IApi) => {
    apiRef.current = api;
  }, []);

  /** Données pour l'export Excel (format simplifié) */
  const exportData = svarTasks.map(t => ({
    name: t.text || '',
    start: t.start || new Date(),
    end: t.end || new Date(),
    progress: t.progress || 0,
    type: t.type || 'task',
  }));

  return (
    <div className="space-y-4 rounded-md border">
      {/* Barre d'outils */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'year'] as ViewModeKey[]).map(mode => (
            <Button
              key={mode}
              size="sm"
              variant={viewMode === mode ? "default" : "outline"}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'day' && <CalendarDays className="h-4 w-4 mr-2" />}
              {mode === 'week' && <CalendarDays className="h-4 w-4 mr-2" />}
              {mode === 'month' && <CalendarRange className="h-4 w-4 mr-2" />}
              {mode === 'year' && <Calendar className="h-4 w-4 mr-2" />}
              {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : mode === 'month' ? 'Mois' : 'Année'}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportGanttToExcel(exportData, projectTitle, viewMode).catch(() =>
                toast.error("Erreur lors de l'export Excel")
              )
            }
            disabled={svarTasks.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Gantt Excel
          </Button>
        </div>
      </div>

      {/* Diagramme de Gantt SVAR */}
      {svarTasks.length > 0 ? (
        <div className="svar-gantt-wrapper">
          <Willow>
            <Gantt
              tasks={svarTasks}
              links={[]}
              scales={SCALES_CONFIG[viewMode]}
              readonly={isProjectClosed}
              cellHeight={38}
              init={handleInit}
              onupdatetask={handleUpdateTask}
            />
          </Willow>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Aucune tâche pour ce projet
        </div>
      )}
    </div>
  );
};
