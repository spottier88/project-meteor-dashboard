
/**
 * @component GanttViewButtons
 * @description Boutons de contrôle pour modifier la vue du diagramme de Gantt.
 * Permet d'afficher ou masquer les tâches des projets dans le diagramme.
 * La fonctionnalité de changement d'échelle temporelle a été désactivée temporairement.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';

interface GanttViewButtonsProps {
  mode: 'week' | 'month' | 'year';
  showTasks: boolean;
  onViewModeChange: (mode: 'week' | 'month' | 'year') => void;
  onShowTasksChange: (show: boolean) => void;
}

export const GanttViewButtons = ({
  mode,
  showTasks,
  onShowTasksChange,
}: GanttViewButtonsProps) => {
  return (
    <div className="space-x-2">
      {/* Les boutons pour changer d'échelle ont été supprimés temporairement */}
      <Button
        variant={showTasks ? "default" : "outline"}
        size="sm"
        onClick={() => onShowTasksChange(!showTasks)}
      >
        {showTasks ? (
          <>
            <List className="h-4 w-4 mr-2" />
            Masquer la liste
          </>
        ) : (
          <>
            <List className="h-4 w-4 mr-2" />
            Afficher la liste
          </>
        )}
      </Button>
    </div>
  );
};
