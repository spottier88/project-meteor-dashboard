import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Image } from 'lucide-react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { GanttTask } from './types';

interface GanttExportButtonsProps {
  tasks: GanttTask[];
  ganttRef: React.RefObject<HTMLDivElement>;
}

export const GanttExportButtons = ({ tasks, ganttRef }: GanttExportButtonsProps) => {
  const handleExportToExcel = () => {
    const data = tasks.map(task => ({
      'Nom': task.name,
      'Date de début': task.start.toLocaleDateString('fr-FR'),
      'Date de fin': task.end.toLocaleDateString('fr-FR'),
      'Type': task.type === 'project' ? 'Projet' : 'Tâche',
      'Statut': task.type === 'project' 
        ? task.lifecycle_status 
        : task.status,
      'Avancement (%)': task.type === 'project' ? task.completion || 0 : ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning");

    const colWidths = [
      { wch: 40 }, // Nom
      { wch: 15 }, // Date de début
      { wch: 15 }, // Date de fin
      { wch: 10 }, // Type
      { wch: 15 }, // Statut
      { wch: 15 }, // Avancement
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, "planning-projets.xlsx");
  };

  const handleExportToPng = async () => {
    if (ganttRef.current) {
      try {
        const canvas = await html2canvas(ganttRef.current, {
          height: ganttRef.current.scrollHeight,
          windowHeight: ganttRef.current.scrollHeight
        });
        const link = document.createElement('a');
        link.download = 'gantt-export.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Erreur lors de l\'export:', error);
      }
    }
  };

  return (
    <div className="space-x-2">
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