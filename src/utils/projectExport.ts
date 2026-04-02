/**
 * Export des données de projets au format Excel via ExcelJS
 */
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { lifecycleStatusLabels } from '@/types/project';
import { downloadWorkbook, addJsonSheet, addArraySheet } from './excelDownload';

/**
 * Exporte les données de projets au format Excel
 * @param projectsData Les données des projets à exporter
 */
export const exportProjectsToExcel = async (projectsData: any[]) => {
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
const createSummarySheet = (wb: ExcelJS.Workbook, projectsData: any[]) => {
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
const createProjectSheet = (wb: ExcelJS.Workbook, data: any) => {
  const projectData: any[][] = [
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
    data.tasks.forEach((task: any) => {
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
    data.risks.forEach((risk: any) => {
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

  const sheetName = (data.project.title || 'Projet').replace(/[:\\\/\?\*\[\]]/g, '-').substring(0, 31);
  addArraySheet(wb, sheetName, projectData, [25, 60, 15, 15, 20]);
};

// Fonctions utilitaires de formatage

const formatProjectManager = (project: any): string => {
  if (!project.project_manager) return '-';
  return project.project_manager_name || project.project_manager;
};

const formatOrganization = (project: any): string => {
  const parts = [];
  if (project.pole_name) parts.push(project.pole_name);
  if (project.direction_name) parts.push(project.direction_name);
  if (project.service_name) parts.push(project.service_name);
  return parts.length > 0 ? parts.join(' / ') : '-';
};

const formatForEntity = (project: any): string => {
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
