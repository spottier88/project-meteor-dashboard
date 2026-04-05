/**
 * @file TaskGantt.tsx
 * @description Composant Gantt pour les tâches d'un projet.
 * Utilise SVAR React Gantt pour le rendu interactif avec drag & drop.
 * Intègre : interception du double-clic (→ TaskForm), menu contextuel,
 * colonnes personnalisées, blocage du reordonnancement et de la progression.
 * 
 * La persistance des dates lors du drag & drop utilise un debounce
 * par tâche pour garantir la sauvegarde même si SVAR n'émet pas
 * d'événement final explicite (inProgress: false).
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
import { format } from "date-fns";

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
  /** Mode lecture seule explicite (désactive le drag & drop et la persistance) */
  isReadOnly?: boolean;
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

/**
 * Formate une date en yyyy-MM-dd en heure locale (évite le décalage UTC)
 */
const formatLocalDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
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
  isReadOnly = false,
}: TaskGanttProps) => {
  const [viewMode, setViewMode] = useState<ViewModeKey>('week');
  const [localTasks, setLocalTasks] = useState<Array<any>>(tasks);
  const apiRef = useRef<IApi | null>(null);

  /** Ref stockant les dernières dates reçues par taskId (pour le debounce) */
  const pendingUpdatesRef = useRef<Map<string, { start?: Date; end?: Date }>>(new Map());
  /** Ref stockant les timers de debounce par taskId */
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /** Le composant est effectivement en lecture seule si le projet est clôturé OU si isReadOnly est passé */
  const effectiveReadOnly = isProjectClosed || isReadOnly;

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
    if (canCreateTask && !effectiveReadOnly) {
      cols.push({ id: 'add-task', header: '', width: 50, align: 'center' });
    }

    return cols;
  }, [canCreateTask, effectiveReadOnly]);

  /**
   * Persiste les dates d'une tâche en base de données.
   * Utilise le formatage local pour éviter les décalages UTC.
   */
  const persistTaskDates = useCallback(async (taskId: string, start?: Date, end?: Date) => {
    try {
      const updatePayload: Record<string, string> = {
        updated_at: new Date().toISOString(),
      };
      if (start) updatePayload.start_date = formatLocalDate(start);
      if (end) updatePayload.due_date = formatLocalDate(end);

      logger.info(`[Gantt] Persistance tâche ${taskId} : ${JSON.stringify(updatePayload)}`);

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .select();

      if (error) throw error;

      toast.success('Dates de la tâche mises à jour');
      onUpdate?.();
    } catch (error) {
      logger.error(`[Gantt] Erreur mise à jour tâche ${taskId}: ${error}`);
      toast.error("Erreur lors de la mise à jour des dates");
      // Refetch pour corriger l'état local en cas d'erreur
      onUpdate?.();
    }
  }, [onUpdate]);

  /**
   * Programme un flush debounced pour une tâche donnée.
   * Stocke les dernières dates et lance la persistance après 300ms d'inactivité.
   */
  const schedulePersist = useCallback((taskId: string, start?: Date, end?: Date) => {
    if (effectiveReadOnly) return;

    // Stocker les dernières valeurs
    const existing = pendingUpdatesRef.current.get(taskId) || {};
    pendingUpdatesRef.current.set(taskId, {
      start: start || existing.start,
      end: end || existing.end,
    });

    // Annuler le timer précédent
    const existingTimer = debounceTimersRef.current.get(taskId);
    if (existingTimer) clearTimeout(existingTimer);

    // Programmer le flush
    const timer = setTimeout(() => {
      const pending = pendingUpdatesRef.current.get(taskId);
      if (pending) {
        pendingUpdatesRef.current.delete(taskId);
        debounceTimersRef.current.delete(taskId);
        persistTaskDates(taskId, pending.start, pending.end);
      }
    }, 300);

    debounceTimersRef.current.set(taskId, timer);
  }, [effectiveReadOnly, persistTaskDates]);

  // Nettoyer les timers au démontage
  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  /**
   * Initialise l'API SVAR et configure les interceptions d'actions.
   * - show-editor : redirige vers le TaskForm existant
   * - add-task : redirige vers le TaskForm en mode création
   * - drag-task : bloque le reordonnancement dans la grille
   * - update-task : écoute les mises à jour de dates via l'API SVAR
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
    api.intercept("drag-task", (ev: { top?: number }) => {
      if (typeof ev.top !== "undefined") return false;
    });

    // Écouter les mises à jour de tâches via l'API SVAR (source fiable)
    api.on("update-task", (ev: { id: string | number; task: Partial<ITask>; inProgress?: boolean }) => {
      const taskId = String(ev.id);
      const updatedFields = ev.task;

      // Bloquer la modification de la progression seule
      if (updatedFields.progress !== undefined && !updatedFields.start && !updatedFields.end) {
        return false;
      }

      // Mettre à jour le state local immédiatement pour la réactivité UI
      if (updatedFields.start || updatedFields.end) {
        setLocalTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  ...(updatedFields.start && { start_date: formatLocalDate(updatedFields.start) }),
                  ...(updatedFields.end && { due_date: formatLocalDate(updatedFields.end) }),
                }
              : t
          )
        );

        // Programmer la persistance via debounce
        // Si c'est l'événement final (inProgress false/undefined), flush immédiat
        if (!ev.inProgress) {
          // Annuler tout debounce en cours et persister immédiatement
          const existingTimer = debounceTimersRef.current.get(taskId);
          if (existingTimer) clearTimeout(existingTimer);
          pendingUpdatesRef.current.delete(taskId);
          debounceTimersRef.current.delete(taskId);
          persistTaskDates(taskId, updatedFields.start, updatedFields.end);
        } else {
          // Événement intermédiaire → debounce (filet de sécurité)
          schedulePersist(taskId, updatedFields.start, updatedFields.end);
        }
      }

      return true;
    });
  }, [onEdit, onAdd, localTasks, effectiveReadOnly, persistTaskDates, schedulePersist]);

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
                readonly={effectiveReadOnly}
                cellHeight={38}
                init={handleInit}
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
