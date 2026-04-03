/**
 * @component GanttExportButtons
 * @description Boutons d'exportation pour le diagramme de Gantt.
 * Permet d'exporter le diagramme au format Excel ou image (PNG).
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Image } from 'lucide-react';
import { toPng } from 'html-to-image';
import ExcelJS from 'exceljs';
import { downloadWorkbook, addJsonSheet } from '@/utils/excelDownload';

/** Format simplifié pour les données d'export */
export interface GanttExportTask {
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: string;
}

interface GanttExportButtonsProps {
  /** Liste des tâches au format simplifié */
  tasks: GanttExportTask[];
  /** Référence vers le conteneur du Gantt pour l'export image */
  ganttRef: React.RefObject<HTMLDivElement>;
}

/**
 * Composant affichant les boutons d'export Excel et PNG
 */
export const GanttExportButtons = ({ tasks, ganttRef }: GanttExportButtonsProps) => {
  /**
   * Exporte les données du Gantt vers un fichier Excel
   */
  const handleExportToExcel = async () => {
    const data = tasks.map(task => ({
      'Nom': task.name,
      'Date de début': task.start.toLocaleDateString('fr-FR'),
      'Date de fin': task.end.toLocaleDateString('fr-FR'),
      'Type': task.type === 'summary' ? 'Projet' : 'Tâche',
      'Avancement (%)': Math.round(task.progress) || 0,
    }));

    const wb = new ExcelJS.Workbook();
    addJsonSheet(wb, "Planning", data, [40, 15, 15, 10, 15]);
    await downloadWorkbook(wb, "planning-projets.xlsx");
  };

  /**
   * Exporte le diagramme Gantt en image PNG
   */
  const handleExportToPng = async () => {
    if (ganttRef.current) {
      try {
        const canvas = await html2canvas(ganttRef.current, {
          height: ganttRef.current.scrollHeight,
          windowHeight: ganttRef.current.scrollHeight,
          backgroundColor: '#ffffff',
        });
        const link = document.createElement('a');
        link.download = 'gantt-projets.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error("Erreur lors de l'export PNG:", error);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportToExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportToPng}>
        <Image className="h-4 w-4 mr-2" />
        Image
      </Button>
    </div>
  );
};
