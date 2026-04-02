/**
 * Utilitaire d'export des points hebdomadaires au format Excel via ExcelJS
 */
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { downloadWorkbook, addJsonSheet } from './excelDownload';

interface ActivityPointWithDetails {
  id: string;
  user_id: string;
  project_id?: string;
  activity_type?: string;
  points: number;
  week_start_date: string;
  description?: string;
  created_at: string;
  projects?: { title: string } | null;
  profiles?: { first_name: string; last_name: string; email: string } | null;
  activity_types?: { label: string; color: string } | null;
}

/**
 * Exporte les points hebdomadaires individuels au format Excel
 */
export const exportWeeklyPointsToExcel = async (
  points: ActivityPointWithDetails[],
  weekStartDate: Date,
  userName?: string
) => {
  const data = points.map(point => ({
    'Date': format(new Date(point.week_start_date), 'dd/MM/yyyy', { locale: fr }),
    'Projet': point.projects?.title || 'Sans projet',
    'Type d\'activité': point.activity_types?.label || point.activity_type || 'Non spécifié',
    'Points': point.points,
    'Description': point.description || '',
    'Créé le': format(new Date(point.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));

  const totalPoints = points.reduce((sum, p) => sum + p.points, 0);
  data.push({
    'Date': '', 'Projet': '', 'Type d\'activité': 'TOTAL',
    'Points': totalPoints, 'Description': '', 'Créé le': ''
  });

  const wb = new ExcelJS.Workbook();
  addJsonSheet(wb, 'Points hebdomadaires', data, [12, 30, 25, 10, 40, 18]);

  const weekLabel = format(weekStartDate, 'dd-MM-yyyy', { locale: fr });
  const userLabel = userName ? `_${userName}` : '';
  await downloadWorkbook(wb, `points_hebdomadaires${userLabel}_${weekLabel}.xlsx`);
};

/**
 * Exporte les points hebdomadaires d'équipe au format Excel
 */
export const exportTeamWeeklyPointsToExcel = async (
  points: ActivityPointWithDetails[],
  weekStartDate: Date
) => {
  const data = points.map(point => ({
    'Utilisateur': point.profiles ? `${point.profiles.first_name} ${point.profiles.last_name}` : 'Inconnu',
    'Email': point.profiles?.email || '',
    'Date': format(new Date(point.week_start_date), 'dd/MM/yyyy', { locale: fr }),
    'Projet': point.projects?.title || 'Sans projet',
    'Type d\'activité': point.activity_types?.label || point.activity_type || 'Non spécifié',
    'Points': point.points,
    'Description': point.description || '',
    'Créé le': format(new Date(point.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));

  const totalPoints = points.reduce((sum, p) => sum + p.points, 0);
  const uniqueUsers = new Set(points.map(p => p.user_id)).size;
  const avgPointsPerUser = uniqueUsers > 0 ? Math.round(totalPoints / uniqueUsers) : 0;

  // Lignes de statistiques
  const emptyRow = { 'Utilisateur': '', 'Email': '', 'Date': '', 'Projet': '', 'Type d\'activité': '', 'Points': null as any, 'Description': '', 'Créé le': '' };
  data.push(
    { ...emptyRow },
    { ...emptyRow, 'Utilisateur': 'STATISTIQUES' },
    { ...emptyRow, 'Utilisateur': 'Total points', 'Points': totalPoints },
    { ...emptyRow, 'Utilisateur': 'Contributeurs actifs', 'Points': uniqueUsers },
    { ...emptyRow, 'Utilisateur': 'Moyenne par personne', 'Points': avgPointsPerUser }
  );

  const wb = new ExcelJS.Workbook();
  addJsonSheet(wb, 'Points équipe', data, [20, 25, 12, 30, 25, 10, 40, 18]);

  const weekLabel = format(weekStartDate, 'dd-MM-yyyy', { locale: fr });
  await downloadWorkbook(wb, `points_equipe_${weekLabel}.xlsx`);
};

/**
 * Exporte les statistiques de points par utilisateur
 */
export const exportUserPointsStats = async (
  points: ActivityPointWithDetails[],
  weekStartDate: Date
) => {
  const userStats = points.reduce((acc, point) => {
    const userId = point.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        name: point.profiles ? `${point.profiles.first_name} ${point.profiles.last_name}` : 'Inconnu',
        email: point.profiles?.email || '',
        totalPoints: 0,
        projectCount: new Set<string>(),
        activityTypeCount: new Set<string>()
      };
    }
    acc[userId].totalPoints += point.points;
    if (point.project_id) acc[userId].projectCount.add(point.project_id);
    if (point.activity_type) acc[userId].activityTypeCount.add(point.activity_type);
    return acc;
  }, {} as Record<string, any>);

  const data = Object.values(userStats).map((stat: any) => ({
    'Utilisateur': stat.name,
    'Email': stat.email,
    'Total points': stat.totalPoints,
    'Nombre de projets': stat.projectCount.size,
    'Nombre de types d\'activité': stat.activityTypeCount.size
  })).sort((a, b) => b['Total points'] - a['Total points']);

  const wb = new ExcelJS.Workbook();
  addJsonSheet(wb, 'Stats utilisateurs', data, [25, 30, 15, 18, 25]);

  const weekLabel = format(weekStartDate, 'dd-MM-yyyy', { locale: fr });
  await downloadWorkbook(wb, `stats_utilisateurs_${weekLabel}.xlsx`);
};
