/**
 * @component GanttLegend
 * @description Légende explicative pour le diagramme de Gantt.
 * Affiche les codes couleur utilisés pour représenter les différents types
 * d'éléments (projets, tâches) dans le diagramme.
 */

import React from 'react';

interface GanttLegendProps {
  /** Indique si les tâches sont affichées */
  showTasks: boolean;
}

/**
 * Composant affichant la légende des couleurs du Gantt
 */
export const GanttLegend = ({ showTasks }: GanttLegendProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm p-2 bg-muted/20 rounded-md">
      {/* Légende des projets */}
      <div className="flex items-center">
        <div className="w-4 h-4 rounded bg-[#9b87f5] mr-2"></div>
        <span className="font-medium">Projet</span>
      </div>
      
      {/* Légende des tâches (visible uniquement si showTasks est activé) */}
      {showTasks && (
        <>
          <div className="w-px h-4 bg-border" />
          
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-[#e2e8f0] mr-2 border"></div>
            <span>À faire</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-[#3b82f6] mr-2"></div>
            <span>En cours</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-[#22c55e] mr-2"></div>
            <span>Terminé</span>
          </div>
        </>
      )}
    </div>
  );
};
