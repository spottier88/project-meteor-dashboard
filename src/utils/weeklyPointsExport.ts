/**
 * Utilitaire d'export des points hebdomadaires au format Excel
 */
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityPointWithDetails {
  id: string;
  user_id: string;
  project_id?: string;
  activity_type?: string;
  points: number;
  week_start_date: string;
  description?: string;
  created_at: string;
  projects?: {
    title: string;
  } | null;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  activity_types?: {
    label: string;
    color: string;
  } | null;
}

/**
 * Exporte les points hebdomadaires individuels au format Excel
 */
export const exportWeeklyPointsToExcel = (
  points: ActivityPointWithDetails[],
  weekStartDate: Date,
  userName?: string
) => {
  // Préparer les données pour l'export
  const data = points.map(point => ({
    'Date': format(new Date(point.week_start_date), 'dd/MM/yyyy', { locale: fr }),
    'Projet': point.projects?.title || 'Sans projet',
    'Type d\'activité': point.activity_types?.label || point.activity_type || 'Non spécifié',
    'Points': point.points,
    'Description': point.description || '',
    'Créé le': format(new Date(point.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));

  // Calculer les totaux
  const totalPoints = points.reduce((sum, p) => sum + p.points, 0);
  
  // Ajouter une ligne de total
  data.push({
    'Date': '',
    'Projet': '',
    'Type d\'activité': 'TOTAL',
    'Points': totalPoints,
    'Description': '',
    'Créé le': ''
  });

  // Créer le workbook et la feuille
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Points hebdomadaires');

  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 30 }, // Projet
    { wch: 25 }, // Type d'activité
    { wch: 10 }, // Points
    { wch: 40 }, // Description
    { wch: 18 }  // Créé le
  ];

  // Générer le nom du fichier
  const weekLabel = format(weekStartDate, 'dd-MM-yyyy', { locale: fr });
  const userLabel = userName ? `_${userName}` : '';
  const fileName = `points_hebdomadaires${userLabel}_${weekLabel}.xlsx`;

  // Télécharger le fichier
  XLSX.writeFile(wb, fileName);
};

/**
 * Exporte les points hebdomadaires d'équipe au format Excel
 */
export const exportTeamWeeklyPointsToExcel = (
  points: ActivityPointWithDetails[],
  weekStartDate: Date
) => {
  // Préparer les données pour l'export
  const data = points.map(point => ({
    'Utilisateur': point.profiles 
      ? `${point.profiles.first_name} ${point.profiles.last_name}`
      : 'Inconnu',
    'Email': point.profiles?.email || '',
    'Date': format(new Date(point.week_start_date), 'dd/MM/yyyy', { locale: fr }),
    'Projet': point.projects?.title || 'Sans projet',
    'Type d\'activité': point.activity_types?.label || point.activity_type || 'Non spécifié',
    'Points': point.points,
    'Description': point.description || '',
    'Créé le': format(new Date(point.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
  }));

  // Calculer les statistiques
  const totalPoints = points.reduce((sum, p) => sum + p.points, 0);
  const uniqueUsers = new Set(points.map(p => p.user_id)).size;
  const avgPointsPerUser = uniqueUsers > 0 ? Math.round(totalPoints / uniqueUsers) : 0;

  // Ajouter les statistiques en bas
  data.push(
    {
      'Utilisateur': '',
      'Email': '',
      'Date': '',
      'Projet': '',
      'Type d\'activité': '',
      'Points': null as any,
      'Description': '',
      'Créé le': ''
    },
    {
      'Utilisateur': 'STATISTIQUES',
      'Email': '',
      'Date': '',
      'Projet': '',
      'Type d\'activité': '',
      'Points': null as any,
      'Description': '',
      'Créé le': ''
    },
    {
      'Utilisateur': 'Total points',
      'Email': '',
      'Date': '',
      'Projet': '',
      'Type d\'activité': '',
      'Points': totalPoints,
      'Description': '',
      'Créé le': ''
    },
    {
      'Utilisateur': 'Contributeurs actifs',
      'Email': '',
      'Date': '',
      'Projet': '',
      'Type d\'activité': '',
      'Points': uniqueUsers,
      'Description': '',
      'Créé le': ''
    },
    {
      'Utilisateur': 'Moyenne par personne',
      'Email': '',
      'Date': '',
      'Projet': '',
      'Type d\'activité': '',
      'Points': avgPointsPerUser,
      'Description': '',
      'Créé le': ''
    }
  );

  // Créer le workbook et la feuille
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Points équipe');

  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 20 }, // Utilisateur
    { wch: 25 }, // Email
    { wch: 12 }, // Date
    { wch: 30 }, // Projet
    { wch: 25 }, // Type d'activité
    { wch: 10 }, // Points
    { wch: 40 }, // Description
    { wch: 18 }  // Créé le
  ];

  // Générer le nom du fichier
  const weekLabel = format(weekStartDate, 'dd-MM-yyyy', { locale: fr });
  const fileName = `points_equipe_${weekLabel}.xlsx`;

  // Télécharger le fichier
  XLSX.writeFile(wb, fileName);
};

/**
 * Exporte les statistiques de points par utilisateur
 */
export const exportUserPointsStats = (
  points: ActivityPointWithDetails[],
  weekStartDate: Date
) => {
  // Grouper par utilisateur
  const userStats = points.reduce((acc, point) => {
    const userId = point.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        name: point.profiles 
          ? `${point.profiles.first_name} ${point.profiles.last_name}`
          : 'Inconnu',
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

  // Convertir en tableau
  const data = Object.values(userStats).map((stat: any) => ({
    'Utilisateur': stat.name,
    'Email': stat.email,
    'Total points': stat.totalPoints,
    'Nombre de projets': stat.projectCount.size,
    'Nombre de types d\'activité': stat.activityTypeCount.size
  })).sort((a, b) => b['Total points'] - a['Total points']);

  // Créer le workbook et la feuille
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stats utilisateurs');

  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 25 }, // Utilisateur
    { wch: 30 }, // Email
    { wch: 15 }, // Total points
    { wch: 18 }, // Nombre de projets
    { wch: 25 }  // Nombre de types d'activité
  ];

  // Générer le nom du fichier
  const weekLabel = format(weekStartDate, 'dd-MM-yyyy', { locale: fr });
  const fileName = `stats_utilisateurs_${weekLabel}.xlsx`;

  // Télécharger le fichier
  XLSX.writeFile(wb, fileName);
};
