
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { lifecycleStatusLabels } from '@/types/project';

/**
 * Fonction pour exporter les données de projets au format Excel
 * @param projectsData Les données des projets à exporter
 */
export const exportProjectsToExcel = (projectsData: any[]) => {
  if (!projectsData || projectsData.length === 0) return;

  // Création d'un nouveau classeur Excel
  const wb = XLSX.utils.book_new();
  
  // Création de l'onglet de sommaire des projets
  createSummarySheet(wb, projectsData);
  
  // Création d'un onglet par projet
  projectsData.forEach(data => {
    createProjectSheet(wb, data);
  });
  
  // Génération du fichier Excel
  const fileName = `projets-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Crée l'onglet de sommaire des projets
 */
const createSummarySheet = (wb: XLSX.WorkBook, projectsData: any[]) => {
  // Données pour le sommaire
  const summaryData = projectsData.map(data => ({
    'Code': data.project.code || '-',
    'Titre': data.project.title || '',
    'Statut': lifecycleStatusLabels[data.project.lifecycle_status] || '',
    'Avancement': `${data.project.completion || 0}%`,
    'Chef de projet': formatProjectManager(data.project),
    'Organisation': formatOrganization(data.project),
    'Date de début': data.project.start_date ? format(new Date(data.project.start_date), 'dd/MM/yyyy') : '-',
    'Date de fin': data.project.end_date ? format(new Date(data.project.end_date), 'dd/MM/yyyy') : '-',
    'Météo': formatWeather(data.lastReview?.weather),
    'Évolution': formatProgress(data.lastReview?.progress),
  }));

  // Création de la feuille
  const ws = XLSX.utils.json_to_sheet(summaryData);
  
  // Ajustement des largeurs de colonnes
  const colWidths = [
    { wch: 10 },  // Code
    { wch: 35 },  // Titre
    { wch: 15 },  // Statut
    { wch: 12 },  // Avancement
    { wch: 25 },  // Chef de projet
    { wch: 35 },  // Organisation
    { wch: 15 },  // Date de début
    { wch: 15 },  // Date de fin
    { wch: 10 },  // Météo
    { wch: 10 },  // Évolution
  ];
  ws['!cols'] = colWidths;
  
  // Ajout de la feuille au classeur
  XLSX.utils.book_append_sheet(wb, ws, "Sommaire");
};

/**
 * Crée un onglet pour un projet spécifique
 */
const createProjectSheet = (wb: XLSX.WorkBook, data: any) => {
  // Données du projet formatées pour l'export
  const projectData = [
    // Informations générales
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
    
    // Organisation et suivi
    ['Organisation et suivi', ''],
    ['Pôle', data.project.pole_name || '-'],
    ['Direction', data.project.direction_name || '-'],
    ['Service', data.project.service_name || '-'],
    ['Chef de projet', formatProjectManager(data.project)],
    ['Suivi DGS', data.project.suivi_dgs ? 'Oui' : 'Non'],
    ['', ''],
    
    // Dernière revue
    ['Dernière revue', ''],
    ['Date', data.lastReview?.created_at ? format(new Date(data.lastReview.created_at), 'dd/MM/yyyy') : '-'],
    ['Météo', formatWeather(data.lastReview?.weather)],
    ['Évolution', formatProgress(data.lastReview?.progress)],
    ['Commentaire', data.lastReview?.comment || ''],
    ['', ''],
  ];
  
  // Ajouter les informations de cadrage si disponibles
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
  
  // Ajouter les scores d'innovation si disponibles
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
  
  // Ajouter les tâches si disponibles
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
  
  // Ajouter les risques si disponibles
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
  
  // Création d'une feuille de calcul à partir des données
  const ws = XLSX.utils.aoa_to_sheet(projectData);
  
  // Ajuster les largeurs des colonnes
  const colWidths = [
    { wch: 25 },  // Première colonne (labels)
    { wch: 60 },  // Deuxième colonne (valeurs)
    { wch: 15 },  // Colonne supplémentaire pour les tableaux
    { wch: 15 },  // Colonne supplémentaire pour les tableaux
    { wch: 20 },  // Colonne supplémentaire pour les tableaux
  ];
  ws['!cols'] = colWidths;
  
  // Ajout de la feuille au classeur
  // Utiliser le titre du projet comme nom d'onglet (limité à 31 caractères pour Excel)
  const sheetName = (data.project.title || 'Projet').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
};

// Fonctions utilitaires de formatage

const formatProjectManager = (project: any): string => {
  if (!project.project_manager) return '-';
  if (project.project_manager_name) {
    return project.project_manager_name;
  }
  return project.project_manager;
};

const formatOrganization = (project: any): string => {
  const parts = [];
  if (project.pole_name) parts.push(project.pole_name);
  if (project.direction_name) parts.push(project.direction_name);
  if (project.service_name) parts.push(project.service_name);
  return parts.length > 0 ? parts.join(' / ') : '-';
};

const formatWeather = (weather: string | null | undefined): string => {
  switch (weather) {
    case 'sunny': return 'Ensoleillé';
    case 'cloudy': return 'Nuageux';
    case 'stormy': return 'Orageux';
    default: return '-';
  }
};

const formatProgress = (progress: string | null | undefined): string => {
  switch (progress) {
    case 'better': return 'Amélioration';
    case 'stable': return 'Stable';
    case 'worse': return 'Dégradation';
    default: return '-';
  }
};

const formatTaskStatus = (status: string | null | undefined): string => {
  switch (status) {
    case 'todo': return 'À faire';
    case 'in_progress': return 'En cours';
    case 'done': return 'Terminé';
    default: return status || '-';
  }
};

const formatRiskLevel = (level: string | null | undefined): string => {
  switch (level) {
    case 'low': return 'Faible';
    case 'medium': return 'Moyen';
    case 'high': return 'Élevé';
    default: return level || '-';
  }
};

const formatRiskStatus = (status: string | null | undefined): string => {
  switch (status) {
    case 'open': return 'Ouvert';
    case 'in_progress': return 'En cours';
    case 'resolved': return 'Résolu';
    default: return status || '-';
  }
};
