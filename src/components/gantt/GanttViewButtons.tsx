/**
 * @component GanttViewButtons
 * @description Boutons de contrôle pour modifier la vue du diagramme de Gantt.
 * Permet de basculer entre les vues semaine, mois et année, ainsi que d'afficher
 * ou masquer les tâches des projets dans le diagramme.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, EyeOff } from 'lucide-react';

interface GanttViewButtonsProps {
  mode: 'week' | 'month' | 'year';
  showTasks: boolean;
  onViewModeChange: (mode: 'week' | 'month' | 'year') => void;
  onShowTasksChange: (show: boolean) => void;
}

export const GanttViewButtons = ({
  mode,
  showTasks,
  onViewModeChange,
  onShowTasksChange,
}: GanttViewButtonsProps) => {
  return (
    <div className="space-x-2">
      <Button
        variant={mode === 'week' ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange('week')}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Semaine
      </Button>
      <Button
        variant={mode === 'month' ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange('month')}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Mois
      </Button>
      <Button
        variant={mode === 'year' ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange('year')}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Année
      </Button>
      <Button
        variant={showTasks ? "default" : "outline"}
        size="sm"
        onClick={() => onShowTasksChange(!showTasks)}
      >
        {showTasks ? (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            Masquer les tâches
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-2" />
            Afficher les tâches
          </>
        )}
      </Button>
    </div>
  );
};
