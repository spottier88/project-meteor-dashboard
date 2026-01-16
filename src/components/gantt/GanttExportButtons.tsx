/**
 * @component GanttExportButtons
 * @description Boutons d'exportation pour le diagramme de Gantt.
 * Permet d'exporter le diagramme au format Excel ou image (PNG).
 * Compatible avec le format Task de gantt-task-react.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Image } from 'lucide-react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Task } from 'gantt-task-react';

interface GanttExportButtonsProps {
  /** Liste des tâches au format gantt-task-react */
  tasks: Task[];
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
  const handleExportToExcel = () => {
    const data = tasks.map(task => ({
      'Nom': task.name,
      'Date de début': task.start.toLocaleDateString('fr-FR'),
      'Date de fin': task.end.toLocaleDateString('fr-FR'),
      'Type': task.type === 'project' ? 'Projet' : 'Tâche',
      'Avancement (%)': Math.round(task.progress) || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning");

    // Définir la largeur des colonnes
    const colWidths = [
      { wch: 40 }, // Nom
      { wch: 15 }, // Date de début
      { wch: 15 }, // Date de fin
      { wch: 10 }, // Type
      { wch: 15 }, // Avancement
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, "planning-projets.xlsx");
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
          backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = 'gantt-projets.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Erreur lors de l\'export PNG:', error);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportToExcel}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportToPng}
      >
        <Image className="h-4 w-4 mr-2" />
        Image
      </Button>
    </div>
  );
};
