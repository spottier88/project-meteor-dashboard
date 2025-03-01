
import React from 'react';

interface GanttLegendProps {
  showTasks: boolean;
}

export const GanttLegend = ({ showTasks }: GanttLegendProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-[#9b87f5] mr-2"></div>
          <span>Projet</span>
        </div>
        {showTasks && (
          <>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-[#F2FCE2] mr-2"></div>
              <span>À faire</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-[#D3E4FD] mr-2"></div>
              <span>En cours</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-[#E2E8F0] mr-2"></div>
              <span>Terminé</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full border border-gray-300 mr-2"></div>
              <span>└ Sous-tâche</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
