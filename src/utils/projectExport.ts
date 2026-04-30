/**
 * Export des données de projets au format Excel via ExcelJS
 */
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { lifecycleStatusLabels } from '@/types/project';
import { downloadWorkbook, addJsonSheet, addArraySheet } from './excelDownload';

/** Forme minimale d'un projet tel qu'attendu dans les données d'export */
interface ExportProject {
  title?: string | null;
  code?: string | null;
  description?: string | null;
  lifecycle_status: string;
  completion?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: string | null;
  pole_name?: string | null;
  direction_name?: string | null;
  service_name?: string | null;
  project_manager?: string | null;
  project_manager_name?: string | null;
  suivi_dgs?: boolean | null;
  for_entity_type?: string | null;
  for_entity_name?: string | null;
}

interface ExportTask {
  title?: string | null;
  status?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  assignee?: string | null;
}

interface ExportRisk {
  description?: string | null;
  probability?: string | null;
  severity?: string | null;
  status?: string | null;
  mitigation_plan?: string | null;
}

interface ExportLastReview {
  created_at?: string | null;
  weather?: string | null;
  progress?: string | null;
  comment?: string | null;
}

interface ExportFraming {
  context?: string | null;
  objectives?: string | null;
  governance?: string | null;
  deliverables?: string | null;
  stakeholders?: string | null;
  timeline?: string | null;
}

interface ExportInnovation {
  impact?: number | null;
  usager?: number | null;
  novateur?: number | null;
  agilite?: number | null;
  ouverture?: number | null;
}

/** Structure complète d'un enregistrement de projet pour l'export */
interface ProjectExportData {
  project: ExportProject;
  lastReview?: ExportLastReview | null;
  framing?: ExportFraming | null;
  innovation?: ExportInnovation | null;
  tasks?: ExportTask[] | null;
  risks?: ExportRisk[] | null;
}

/**
 * Exporte les données de projets au format Excel
 * @param projectsData Les données des projets à exporter
 */
export const exportProjectsToExcel = async (projectsData: ProjectExportData[]) => {
  if (!projectsData || projectsData.length === 0) return;

  const wb = new ExcelJS.Workbook();

  // Onglet sommaire
  createSummarySheet(wb, projectsData);

  // Un onglet par projet
  projectsData.forEach(data => {
    createProjectSheet(wb, data);
  });

  const fileName = `projets-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  await downloadWorkbook(wb, fileName);
};

/** Crée l'onglet de sommaire des projets */
const createSummarySheet = (wb: ExcelJS.Workbook, projectsData: ProjectExportData[]) => {
  const summaryData = projectsData.map(data => ({
    'Code': data.project.code || '-',
    'Titre': data.project.title || '',
    'Statut': lifecycleStatusLabels[data.project.lifecycle_status] || '',
    'Avancement': `${data.project.completion || 0}%`,
    'Chef de projet': formatProjectManager(data.project),
    'Organisation': formatOrganization(data.project),
    'Pour': formatForEntity(data.project),
    'Date de début': data.project.start_date ? format(new Date(data.project.start_date), 'dd/MM/yyyy') : '-',
    'Date de fin': data.project.end_date ? format(new Date(data.project.end_date), 'dd/MM/yyyy') : '-',
    'Météo': formatWeather(data.lastReview?.weather),
    'Évolution': formatProgress(data.lastReview?.progress),
  }));

  addJsonSheet(wb, "Sommaire", summaryData, [10, 35, 15, 12, 25, 35, 35, 15, 15, 10, 10]);
};

/** Crée un onglet pour un projet spécifique */
const createProjectSheet = (wb: ExcelJS.Workbook, data: ProjectExportData) => {
  const projectData: (string | number | null | undefined)[][] = [
    ['Informations générales', ''],
    ['Titre', data.project.title || ''],
    ['Code', data.project.code || '-'],
    ['Description', data.project.description || ''],
    ['Statut', lifecycleStatusLabels[data.project.lifecycle_status] || ''],
    ['Date de début', data.project.start_date ? format(new Date(data.project.start_date), 'dd/MM/yyyy') : '-'],
    ['Date de fin', data.project.end_date ? format(new Date(data.project.end_date), 'dd/MM/yyyy') : '-'],
    ['Priorité', data.project.priority || '-'],
    ['Avancement', `${data.project.completion || 0}%`],
    ['', ''],
    ['Organisation et suivi', ''],
    ['Pôle', data.project.pole_name || '-'],
    ['Direction', data.project.direction_name || '-'],
    ['Service', data.project.service_name || '-'],
    ['Chef de projet', formatProjectManager(data.project)],
    ['Suivi DGS', data.project.suivi_dgs ? 'Oui' : 'Non'],
    ['Pour qui', formatForEntity(data.project)],
    ['', ''],
    ['Dernière revue', ''],
    ['Date', data.lastReview?.created_at ? format(new Date(data.lastReview.created_at), 'dd/MM/yyyy') : '-'],
    ['Météo', formatWeather(data.lastReview?.weather)],
    ['Évolution', formatProgress(data.lastReview?.progress)],
    ['Commentaire', data.lastReview?.comment || ''],
    ['', ''],
  ];

  if (data.framing) {
    projectData.push(
      ['Informations de cadrage', ''],
      ['Contexte', data.framing.context || ''],
      ['Objectifs', data.framing.objectives || ''],
      ['Gouvernance', data.framing.governance || ''],
      ['Livrables', data.framing.deliverables || ''],
      ['Parties prenantes', data.framing.stakeholders || ''],
      ['Calendrier', data.framing.timeline || ''],
      ['', '']
    );
  }

  if (data.innovation) {
    projectData.push(
      ['Scores d\'innovation', ''],
      ['Impact', data.innovation.impact || 0],
      ['Usager', data.innovation.usager || 0],
      ['Novateur', data.innovation.novateur || 0],
      ['Agilité', data.innovation.agilite || 0],
      ['Ouverture', data.innovation.ouverture || 0],
      ['', '']
    );
  }

  if (data.tasks && data.tasks.length > 0) {
    projectData.push(['Tâches', '']);
    projectData.push(['Titre', 'Statut', 'Date début', 'Date fin', 'Assigné à']);
    data.tasks.forEach((task: ExportTask) => {
      projectData.push([
        task.title || '',
        formatTaskStatus(task.status),
        task.start_date ? format(new Date(task.start_date), 'dd/MM/yyyy') : '-',
        task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-',
        task.assignee || '-'
      ]);
    });
    projectData.push(['', '']);
  }

  if (data.risks && data.risks.length > 0) {
    projectData.push(['Risques', '']);
    projectData.push(['Description', 'Probabilité', 'Sévérité', 'Statut', 'Plan d\'atténuation']);
    data.risks.forEach((risk: ExportRisk) => {
      projectData.push([
        risk.description || '',
        formatRiskLevel(risk.probability),
        formatRiskLevel(risk.severity),
        formatRiskStatus(risk.status),
        risk.mitigation_plan || '-'
      ]);
    });
    projectData.push(['', '']);
  }

  const sheetName = (data.project.title || 'Projet').replace(/[:\\/?\*[\]]/g, '-').substring(0, 31); // eslint-disable-line no-useless-escape
  addArraySheet(wb, sheetName, projectData, [25, 60, 15, 15, 20]);
};

// Fonctions utilitaires de formatage

const formatProjectManager = (project: ExportProject): string => {
  if (!project.project_manager) return '-';
  return project.project_manager_name || project.project_manager;
};

const formatOrganization = (project: ExportProject): string => {
  const parts = [];
  if (project.pole_name) parts.push(project.pole_name);
  if (project.direction_name) parts.push(project.direction_name);
  if (project.service_name) parts.push(project.service_name);
  return parts.length > 0 ? parts.join(' / ') : '-';
};

const formatForEntity = (project: ExportProject): string => {
  if (!project.for_entity_type || !project.for_entity_name) return '-';
  const entityTypeLabels: Record<string, string> = { 'pole': 'Pôle', 'direction': 'Direction', 'service': 'Service' };
  return `${entityTypeLabels[project.for_entity_type] || project.for_entity_type} ${project.for_entity_name}`;
};

const formatWeather = (weather: string | null | undefined): string => {
  switch (weather) { case 'sunny': return 'Ensoleillé'; case 'cloudy': return 'Nuageux'; case 'stormy': return 'Orageux'; default: return '-'; }
};

const formatProgress = (progress: string | null | undefined): string => {
  switch (progress) { case 'better': return 'Amélioration'; case 'stable': return 'Stable'; case 'worse': return 'Dégradation'; default: return '-'; }
};

const formatTaskStatus = (status: string | null | undefined): string => {
  switch (status) { case 'todo': return 'À faire'; case 'in_progress': return 'En cours'; case 'done': return 'Terminé'; default: return status || '-'; }
};

const formatRiskLevel = (level: string | null | undefined): string => {
  switch (level) { case 'low': return 'Faible'; case 'medium': return 'Moyen'; case 'high': return 'Élevé'; default: return level || '-'; }
};

const formatRiskStatus = (status: string | null | undefined): string => {
  switch (status) { case 'open': return 'Ouvert'; case 'in_progress': return 'En cours'; case 'resolved': return 'Résolu'; default: return status || '-'; }
};
