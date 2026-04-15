/**
 * Utilitaire d'export des tâches au format Excel via ExcelJS
 */
import { format } from "date-fns";
import ExcelJS from 'exceljs';
import { downloadWorkbook, addJsonSheet } from './excelDownload';

/**
 * Exporte les tâches d'un projet au format Excel
 */
export const exportTasksToExcel = async (tasks: any[], projectTitle: string) => {
  if (!tasks || tasks.length === 0) return;

  const exportData = tasks.map(task => ({
    'ID': task.id || '',
    'Titre': task.title || '',
    'Description': task.description || '',
    'Statut': getStatusLabel(task.status),
    'Assigné à': task.assignee || '',
    'Date de début': task.start_date ? format(new Date(task.start_date), 'dd/MM/yyyy') : '',
    'Date limite': task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '',
    'Tâche parente': task.parent_task_id ? 'Oui' : 'Non',
    'ID de la tâche parente': task.parent_task_id || ''
  }));

  const wb = new ExcelJS.Workbook();
  addJsonSheet(wb, "Tâches", exportData, [40, 30, 50, 15, 30, 15, 15, 10, 40]);

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `taches_${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr}.xlsx`;

  await downloadWorkbook(wb, fileName);
};

/** Libellé du statut d'une tâche */
const getStatusLabel = (status: string): string => {
  switch (status) {
    case "todo": return "À faire";
    case "in_progress": return "En cours";
    case "done": return "Terminé";
    default: return status;
  }
};
