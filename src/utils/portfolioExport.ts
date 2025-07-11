
/**
 * @utils portfolioExport
 * @description Utilitaires pour l'export des données de portefeuille au format Excel.
 * Génère des feuilles avec statistiques, liste des projets et graphiques.
 */

import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PortfolioData {
  id: string;
  name: string;
  description: string | null;
  strategic_objectives: string | null;
  budget_total: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  project_count: number;
  average_completion: number;
  projects: any[];
  statusStats: {
    sunny: number;
    cloudy: number;
    stormy: number;
  };
  lifecycleStats: {
    study: number;
    validated: number;
    in_progress: number;
    completed: number;
    suspended: number;
    abandoned: number;
  };
}

/**
 * Génère un fichier Excel avec les données du portefeuille
 */
export const generatePortfolioExcel = async (portfolioData: PortfolioData) => {
  console.log('Génération Excel pour le portefeuille:', portfolioData.name);
  
  const workbook = XLSX.utils.book_new();

  // Feuille 1: Informations générales du portefeuille
  const portfolioInfo = [
    ['INFORMATIONS DU PORTEFEUILLE'],
    [''],
    ['Nom', portfolioData.name],
    ['Description', portfolioData.description || 'Non renseigné'],
    ['Statut', portfolioData.status || 'Non défini'],
    ['Nombre de projets', portfolioData.project_count],
    ['Avancement moyen', `${portfolioData.average_completion}%`],
    ['Budget total', portfolioData.budget_total ? `${portfolioData.budget_total.toLocaleString('fr-FR')} €` : 'Non défini'],
    ['Date de début', portfolioData.start_date ? format(new Date(portfolioData.start_date), 'dd/MM/yyyy', { locale: fr }) : 'Non définie'],
    ['Date de fin', portfolioData.end_date ? format(new Date(portfolioData.end_date), 'dd/MM/yyyy', { locale: fr }) : 'Non définie'],
    [''],
    ['OBJECTIFS STRATÉGIQUES'],
    [''],
    [portfolioData.strategic_objectives || 'Non renseignés']
  ];

  const portfolioSheet = XLSX.utils.aoa_to_sheet(portfolioInfo);
  XLSX.utils.book_append_sheet(workbook, portfolioSheet, 'Informations générales');

  // Feuille 2: Statistiques par statut
  const statusData = [
    ['RÉPARTITION PAR STATUT'],
    [''],
    ['Statut', 'Nombre de projets', 'Pourcentage'],
    ['Ensoleillé', portfolioData.statusStats.sunny, `${Math.round((portfolioData.statusStats.sunny / portfolioData.project_count) * 100)}%`],
    ['Nuageux', portfolioData.statusStats.cloudy, `${Math.round((portfolioData.statusStats.cloudy / portfolioData.project_count) * 100)}%`],
    ['Orageux', portfolioData.statusStats.stormy, `${Math.round((portfolioData.statusStats.stormy / portfolioData.project_count) * 100)}%`],
    [''],
    ['RÉPARTITION PAR CYCLE DE VIE'],
    [''],
    ['Cycle de vie', 'Nombre de projets', 'Pourcentage'],
    ['À l\'étude', portfolioData.lifecycleStats.study, `${Math.round((portfolioData.lifecycleStats.study / portfolioData.project_count) * 100)}%`],
    ['Validé', portfolioData.lifecycleStats.validated, `${Math.round((portfolioData.lifecycleStats.validated / portfolioData.project_count) * 100)}%`],
    ['En cours', portfolioData.lifecycleStats.in_progress, `${Math.round((portfolioData.lifecycleStats.in_progress / portfolioData.project_count) * 100)}%`],
    ['Terminé', portfolioData.lifecycleStats.completed, `${Math.round((portfolioData.lifecycleStats.completed / portfolioData.project_count) * 100)}%`],
    ['Suspendu', portfolioData.lifecycleStats.suspended, `${Math.round((portfolioData.lifecycleStats.suspended / portfolioData.project_count) * 100)}%`],
    ['Abandonné', portfolioData.lifecycleStats.abandoned, `${Math.round((portfolioData.lifecycleStats.abandoned / portfolioData.project_count) * 100)}%`]
  ];

  const statsSheet = XLSX.utils.aoa_to_sheet(statusData);
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');

  // Feuille 3: Liste détaillée des projets
  const projectsHeader = [
    'Projet',
    'Chef de projet',
    'Statut',
    'Cycle de vie',
    'Priorité',
    'Date de début',
    'Date de fin',
    'Avancement'
  ];

  const projectsData = [projectsHeader, ...portfolioData.projects.map(project => [
    project.title,
    project.project_manager || 'Non assigné',
    project.status === 'sunny' ? 'Ensoleillé' : 
    project.status === 'cloudy' ? 'Nuageux' : 
    project.status === 'stormy' ? 'Orageux' : 'Non défini',
    project.lifecycle_status === 'study' ? 'À l\'étude' :
    project.lifecycle_status === 'validated' ? 'Validé' :
    project.lifecycle_status === 'in_progress' ? 'En cours' :
    project.lifecycle_status === 'completed' ? 'Terminé' :
    project.lifecycle_status === 'suspended' ? 'Suspendu' :
    project.lifecycle_status === 'abandoned' ? 'Abandonné' : 'Non défini',
    project.priority === 'high' ? 'Haute' :
    project.priority === 'medium' ? 'Moyenne' :
    project.priority === 'low' ? 'Basse' : 'Non définie',
    project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy', { locale: fr }) : 'Non définie',
    project.end_date ? format(new Date(project.end_date), 'dd/MM/yyyy', { locale: fr }) : 'Non définie',
    project.progress || 'Non défini'
  ])];

  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Liste des projets');

  // Génération et téléchargement du fichier
  const fileName = `portefeuille-${portfolioData.name.replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  console.log('Export Excel terminé:', fileName);
};
