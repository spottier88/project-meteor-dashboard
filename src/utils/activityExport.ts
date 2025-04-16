import { format } from "date-fns";
import * as XLSX from 'xlsx';

export const exportActivitiesToExcel = (activities: any[], periodStart: Date) => {
  if (!activities) return;

  const exportData = activities.map(activity => ({
    'Date': format(new Date(activity.start_time), 'dd/MM/yyyy'),
    'Utilisateur': activity.profiles ? `${activity.profiles.first_name} ${activity.profiles.last_name}` : 'N/A',
    'Projet': activity.projects?.title || 'N/A',
    'Type d\'activité': activity.activity_type,
    'Durée (heures)': Math.round((activity.duration_minutes / 60) * 100) / 100,
    'Description': activity.description || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Activités");

  const colWidths = [
    { wch: 12 }, // Date
    { wch: 30 }, // Utilisateur
    { wch: 30 }, // Projet
    { wch: 15 }, // Type d'activité
    { wch: 15 }, // Durée
    { wch: 50 }, // Description
  ];
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `activites_${format(periodStart, 'yyyy-MM-dd')}.xlsx`);
};

export const exportTasksToExcel = (tasks: any[], projectTitle: string) => {
  if (!tasks || tasks.length === 0) return;

  const exportData = tasks.map(task => {
    return {
      'ID': task.id || '',
      'Titre': task.title || '',
      'Description': task.description || '',
      'Statut': getStatusLabel(task.status),
      'Assigné à': task.assignee || '',
      'Date de début': task.start_date ? format(new Date(task.start_date), 'dd/MM/yyyy') : '',
      'Date limite': task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '',
      'Tâche parente': task.parent_task_id ? 'Oui' : 'Non',
      'ID de la tâche parente': task.parent_task_id || ''
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tâches");

  const colWidths = [
    { wch: 40 }, // ID
    { wch: 30 }, // Titre
    { wch: 50 }, // Description
    { wch: 15 }, // Statut
    { wch: 30 }, // Assigné à
    { wch: 15 }, // Date de début
    { wch: 15 }, // Date limite
    { wch: 10 }, // Tâche parente
    { wch: 40 }, // ID de la tâche parente
  ];
  ws['!cols'] = colWidths;

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `taches_${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "todo":
      return "À faire";
    case "in_progress":
      return "En cours";
    case "done":
      return "Terminé";
    default:
      return status;
  }
};
