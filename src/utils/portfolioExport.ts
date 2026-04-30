/**
 * @utils portfolioExport
 * @description Utilitaires pour l'export des données de portefeuille au format Excel via ExcelJS.
 */
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { downloadWorkbook, addArraySheet } from './excelDownload';

interface PortfolioProjectItem {
  title?: string | null;
  project_manager?: string | null;
  status?: string | null;
  lifecycle_status?: string | null;
  priority?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  completion?: number | null;
}

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
  projects: PortfolioProjectItem[];
  statusStats: { sunny: number; cloudy: number; stormy: number };
  lifecycleStats: { study: number; validated: number; in_progress: number; completed: number; suspended: number; abandoned: number };
}

/**
 * Génère un fichier Excel avec les données du portefeuille
 */
export const generatePortfolioExcel = async (portfolioData: PortfolioData) => {
  const wb = new ExcelJS.Workbook();

  // Feuille 1 : Informations générales
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
  addArraySheet(wb, 'Informations générales', portfolioInfo, [30, 50]);

  // Feuille 2 : Statistiques
  const pc = portfolioData.project_count || 1;
  const statusData = [
    ['RÉPARTITION PAR STATUT'],
    [''],
    ['Statut', 'Nombre de projets', 'Pourcentage'],
    ['Ensoleillé', portfolioData.statusStats.sunny, `${Math.round((portfolioData.statusStats.sunny / pc) * 100)}%`],
    ['Nuageux', portfolioData.statusStats.cloudy, `${Math.round((portfolioData.statusStats.cloudy / pc) * 100)}%`],
    ['Orageux', portfolioData.statusStats.stormy, `${Math.round((portfolioData.statusStats.stormy / pc) * 100)}%`],
    [''],
    ['RÉPARTITION PAR CYCLE DE VIE'],
    [''],
    ['Cycle de vie', 'Nombre de projets', 'Pourcentage'],
    ['À l\'étude', portfolioData.lifecycleStats.study, `${Math.round((portfolioData.lifecycleStats.study / pc) * 100)}%`],
    ['Validé', portfolioData.lifecycleStats.validated, `${Math.round((portfolioData.lifecycleStats.validated / pc) * 100)}%`],
    ['En cours', portfolioData.lifecycleStats.in_progress, `${Math.round((portfolioData.lifecycleStats.in_progress / pc) * 100)}%`],
    ['Terminé', portfolioData.lifecycleStats.completed, `${Math.round((portfolioData.lifecycleStats.completed / pc) * 100)}%`],
    ['Suspendu', portfolioData.lifecycleStats.suspended, `${Math.round((portfolioData.lifecycleStats.suspended / pc) * 100)}%`],
    ['Abandonné', portfolioData.lifecycleStats.abandoned, `${Math.round((portfolioData.lifecycleStats.abandoned / pc) * 100)}%`]
  ];
  addArraySheet(wb, 'Statistiques', statusData, [25, 20, 15]);

  // Feuille 3 : Liste des projets
  const projectsRows: (string | number | null | undefined)[][] = [
    ['Projet', 'Chef de projet', 'Statut', 'Cycle de vie', 'Priorité', 'Date de début', 'Date de fin', 'Avancement (%)'],
    ...portfolioData.projects.map(project => [
      project.title,
      project.project_manager || 'Non assigné',
      project.status === 'sunny' ? 'Ensoleillé' : project.status === 'cloudy' ? 'Nuageux' : project.status === 'stormy' ? 'Orageux' : 'Non défini',
      project.lifecycle_status === 'study' ? 'À l\'étude' : project.lifecycle_status === 'validated' ? 'Validé' : project.lifecycle_status === 'in_progress' ? 'En cours' : project.lifecycle_status === 'completed' ? 'Terminé' : project.lifecycle_status === 'suspended' ? 'Suspendu' : project.lifecycle_status === 'abandoned' ? 'Abandonné' : 'Non défini',
      project.priority === 'high' ? 'Haute' : project.priority === 'medium' ? 'Moyenne' : project.priority === 'low' ? 'Basse' : 'Non définie',
      project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy', { locale: fr }) : 'Non définie',
      project.end_date ? format(new Date(project.end_date), 'dd/MM/yyyy', { locale: fr }) : 'Non définie',
      project.completion || 0
    ])
  ];

  const projectsSheet = addArraySheet(wb, 'Liste des projets', projectsRows, [30, 25, 15, 15, 12, 15, 15, 15]);
  // En-tête en gras
  projectsSheet.getRow(1).font = { bold: true };

  const fileName = `portefeuille-${portfolioData.name.replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  await downloadWorkbook(wb, fileName);
};
