
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
