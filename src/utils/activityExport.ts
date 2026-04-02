/**
 * Utilitaire d'export des activités et tâches au format Excel via ExcelJS
 */
import { format } from "date-fns";
import ExcelJS from 'exceljs';
import { downloadWorkbook, addJsonSheet } from './excelDownload';

/**
 * Exporte les activités au format Excel
 */
export const exportActivitiesToExcel = async (activities: any[], periodStart: Date) => {
  if (!activities) return;

  const exportData = activities.map(activity => ({
    'Date': format(new Date(activity.start_time), 'dd/MM/yyyy'),
    'Utilisateur': activity.profiles ? `${activity.profiles.first_name} ${activity.profiles.last_name}` : 'N/A',
    'Projet': activity.projects?.title || 'N/A',
    'Type d\'activité': activity.activity_type,
    'Durée (heures)': Math.round((activity.duration_minutes / 60) * 100) / 100,
    'Description': activity.description || ''
  }));

  const wb = new ExcelJS.Workbook();
  addJsonSheet(wb, "Activités", exportData, [12, 30, 30, 15, 15, 50]);

  await downloadWorkbook(wb, `activites_${format(periodStart, 'yyyy-MM-dd')}.xlsx`);
};

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
