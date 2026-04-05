/**
 * @file TaskGantt.tsx
 * @description Composant Gantt pour les tâches d'un projet.
 * Utilise SVAR React Gantt pour le rendu interactif avec drag & drop.
 * Intègre : interception du double-clic (→ TaskForm), menu contextuel,
 * colonnes personnalisées, blocage du reordonnancement et de la progression.
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Gantt, Willow } from '@svar-ui/react-gantt';
import "@svar-ui/react-gantt/all.css";
import "@/styles/gantt.css";
import { Locale } from "@svar-ui/react-core";
import { fr } from "@/locales/fr";
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
  /** Callback d'édition d'une tâche (ouvre TaskForm) */
  onEdit?: (task: any) => void;
  /** Callback de rafraîchissement après modification */
  onUpdate?: () => void;
  /** Callback d'ajout d'une tâche (ouvre TaskForm en création) */
  onAdd?: (parentTaskId?: string | null) => void;
  /** Callback de suppression d'une tâche (ouvre la confirmation) */
  onDelete?: (task: any) => void;
  onExpanderClick?: (task: any) => void;
  isProjectClosed?: boolean;
  projectTitle?: string;
  /** L'utilisateur peut-il créer des tâches ? */
  canCreateTask?: boolean;
  /** L'utilisateur peut-il supprimer des tâches ? */
  canDeleteTask?: boolean;
  /** Contexte d'export : projet, portefeuille ou panier */
  exportContext?: 'project' | 'portfolio' | 'cart';
}

/** Configuration des échelles de temps selon le mode de vue */
type ViewModeKey = 'day' | 'week' | 'month' | 'year';

const SCALES_CONFIG: Record<ViewModeKey, Array<{ unit: string; step: number; format: string }>> = {
  day: [
    { unit: 'month', step: 1, format: '%F %Y' },
    { unit: 'day',   step: 1, format: '%j' },
  ],
  week: [
    { unit: 'month', step: 1, format: '%F %Y' },
    { unit: 'week',  step: 1, format: '%d %M' },
  ],
  month: [
    { unit: 'year',  step: 1, format: '%Y' },
    { unit: 'month', step: 1, format: '%F' },
  ],
  year: [
    { unit: 'year',  step: 1, format: '%Y' },
  ],
};

export const TaskGantt = ({
  tasks,
  projectId,
  onEdit,
  onUpdate,
  onAdd,
  onDelete,
  onExpanderClick,
  isProjectClosed = false,
  projectTitle,
  canCreateTask = false,
  canDeleteTask = false,
  exportContext = 'project',
}: TaskGanttProps) => {
  const [viewMode, setViewMode] = useState<ViewModeKey>('week');
  const [localTasks, setLocalTasks] = useState<Array<any>>(tasks);
  const apiRef = useRef<IApi | null>(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Transformer les tâches au format SVAR
  const svarTasks = mapTasksToSvarFormat(localTasks);

  /**
   * Configuration des colonnes de la grille.
   * Masque la colonne "+" si le projet est clôturé ou sans droits de création.
   */
  const columns = useMemo(() => {
    const cols: Array<{ id: string; header: string; flexgrow?: number; width?: number; align?: "left" | "right" | "center"; sort?: boolean }> = [
      { id: 'text', header: 'Tâche', flexgrow: 2, sort: true },
      { id: 'start', header: 'Début', flexgrow: 1, align: 'center', sort: true },
      { id: 'end', header: 'Fin', flexgrow: 1, align: 'center', sort: true },
      { id: 'progress', header: '%', width: 60, align: 'center' },
    ];

    // Ajouter la colonne "+" uniquement si l'utilisateur peut créer des tâches
    if (canCreateTask && !isProjectClosed) {
      cols.push({ id: 'add-task', header: '', width: 50, align: 'center' });
    }

    return cols;
  }, [canCreateTask, isProjectClosed]);

  /**
   * Gère la mise à jour d'une tâche (drag & drop des dates uniquement).
   * Bloque la modification de la progression par drag.
   */
  const handleUpdateTask = useCallback(async (ev: { id: string | number; task: Partial<ITask>; inProgress?: boolean }) => {
    // Ignorer les mises à jour intermédiaires (pendant le drag)
    if (ev.inProgress) return;

    const taskId = String(ev.id);
    const updatedFields = ev.task;

    // Bloquer la modification de la progression par drag (le statut pilote la progression)
    if (updatedFields.progress !== undefined && !updatedFields.start && !updatedFields.end) {
      return false;
    }

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
   * Initialise l'API SVAR et configure les interceptions d'actions.
   * - show-editor : redirige vers le TaskForm existant
   * - add-task : redirige vers le TaskForm en mode création
   * - drag-task : bloque le reordonnancement dans la grille
   */
  const handleInit = useCallback((api: IApi) => {
    apiRef.current = api;

    // Intercepter le double-clic → ouvrir le TaskForm existant au lieu de l'éditeur SVAR
    api.intercept("show-editor", (data: { id: string | number }) => {
      if (onEdit) {
        const task = localTasks.find(t => t.id === String(data.id));
        if (task) {
          onEdit(task);
        }
      }
      return false; // Toujours bloquer l'éditeur SVAR natif
    });

    // Intercepter l'ajout de tâche via le bouton "+" → ouvrir le TaskForm en mode création
    api.intercept("add-task", (data: { id?: string | number; task?: Partial<ITask> }) => {
      if (onAdd) {
        // Si la tâche parente est de type summary/projet, créer une tâche racine
        const parentId = data.id ? String(data.id) : null;
        const parentTask = localTasks.find(t => t.id === parentId);
        const isParentProject = parentTask?.type === 'project' || (!parentTask?.parent_task_id && parentTask?.project_id === parentTask?.id);
        onAdd(isParentProject ? null : parentId);
      }
      return false; // Bloquer la création SVAR native
    });

    // Bloquer le reordonnancement par drag dans la grille
    // (la hiérarchie est gérée via le formulaire)
    api.intercept("drag-task", (ev: { top?: number }) => {
      if (typeof ev.top !== "undefined") return false;
    });
  }, [onEdit, onAdd, localTasks]);

  /** Données pour l'export Excel (format simplifié) */
  const exportData = svarTasks.map(t => ({
    id: String(t.id),
    parentId: t.parent ? String(t.parent) : null,
    name: t.text || '',
    start: t.start || new Date(),
    end: t.end || new Date(),
    progress: t.progress || 0,
    type: t.type || 'task',
    isParent: t.type === 'summary',
  }));

  return (
    <div className="space-y-4 rounded-md border flex flex-col h-full">
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
              exportGanttToExcel(exportData, projectTitle, viewMode, exportContext).catch(() =>
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
        <div className="svar-gantt-wrapper flex-1 overflow-y-auto min-h-0">
          <Locale words={fr}>
            <Willow>
              <Gantt
                tasks={svarTasks}
                links={[]}
                scales={SCALES_CONFIG[viewMode]}
                columns={columns}
                readonly={isProjectClosed}
                cellHeight={38}
                init={handleInit}
                onupdatetask={handleUpdateTask}
              />
            </Willow>
          </Locale>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Aucune tâche pour ce projet
        </div>
      )}
    </div>
  );
};
