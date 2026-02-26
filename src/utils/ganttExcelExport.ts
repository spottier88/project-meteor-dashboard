/**
 * @file ganttExcelExport.ts
 * @description Export Excel avec visualisation Gantt pour les tâches d'un projet.
 * Génère un fichier Excel contenant les données des tâches et une représentation
 * visuelle du Gantt via des marqueurs textuels dans les colonnes temporelles.
 */

import * as XLSX from 'xlsx';
import { Task } from 'gantt-task-react';
import { startOfWeek, addWeeks, isWithinInterval, format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Traduit le statut d'une tâche gantt-task-react en libellé français
 */
const getStatusLabel = (task: Task): string => {
  if (task.progress === 100) return 'Terminé';
  if (task.progress > 0) return 'En cours';
  return 'À faire';
};

/**
 * Retourne le marqueur visuel selon le statut de la tâche
 * ■ pour terminé, ▓ pour en cours, ░ pour à faire
 */
const getMarker = (task: Task): string => {
  if (task.progress === 100) return '■'; // Terminé
  if (task.progress > 0) return '▓';    // En cours
  return '░';                            // À faire
};

/**
 * Calcule la plage temporelle globale (min/max) avec une marge d'une semaine
 */
const getDateRange = (tasks: Task[]): { start: Date; end: Date } => {
  if (tasks.length === 0) {
    const now = new Date();
    return { start: now, end: addWeeks(now, 4) };
  }

  let minDate = tasks[0].start;
  let maxDate = tasks[0].end;

  tasks.forEach(task => {
    if (task.start < minDate) minDate = task.start;
    if (task.end > maxDate) maxDate = task.end;
  });

  // Marge d'une semaine de chaque côté
  return {
    start: startOfWeek(addDays(minDate, -7), { weekStartsOn: 1 }),
    end: addWeeks(startOfWeek(maxDate, { weekStartsOn: 1 }), 2),
  };
};

/**
 * Génère la liste des lundis (début de semaine) couvrant la plage temporelle
 */
const generateWeekStarts = (start: Date, end: Date): Date[] => {
  const weeks: Date[] = [];
  let current = startOfWeek(start, { weekStartsOn: 1 });

  while (current <= end) {
    weeks.push(new Date(current));
    current = addWeeks(current, 1);
  }

  return weeks;
};

/**
 * Vérifie si une tâche est active durant une semaine donnée
 */
const isTaskActiveInWeek = (task: Task, weekStart: Date): boolean => {
  const weekEnd = addDays(weekStart, 6);
  // La tâche chevauche la semaine si elle commence avant la fin de semaine
  // ET finit après le début de semaine
  return task.start <= weekEnd && task.end >= weekStart;
};

/**
 * Exporte les tâches du Gantt vers un fichier Excel avec visualisation temporelle
 * @param tasks - Liste des tâches au format gantt-task-react
 * @param projectTitle - Titre du projet pour le nom du fichier
 */
export const exportGanttToExcel = (tasks: Task[], projectTitle?: string): void => {
  if (tasks.length === 0) return;

  const title = projectTitle || 'projet';
  const { start, end } = getDateRange(tasks);
  const weekStarts = generateWeekStarts(start, end);

  // Colonnes fixes
  const fixedHeaders = ['Nom', 'Statut', 'Date début', 'Date fin', 'Avancement (%)'];

  // Colonnes temporelles (format "dd/MM")
  const weekHeaders = weekStarts.map(w => format(w, 'dd/MM', { locale: fr }));

  // Construction de l'en-tête
  const headers = [...fixedHeaders, ...weekHeaders];

  // Construction des lignes de données
  const rows = tasks
    .filter(t => t.type !== 'project') // Exclure les lignes de type "projet" (regroupement)
    .map(task => {
      const fixedData = [
        task.name,
        getStatusLabel(task),
        format(task.start, 'dd/MM/yyyy', { locale: fr }),
        format(task.end, 'dd/MM/yyyy', { locale: fr }),
        Math.round(task.progress),
      ];

      // Cellules Gantt : marqueur si la tâche est active cette semaine, vide sinon
      const marker = getMarker(task);
      const ganttData = weekStarts.map(weekStart =>
        isTaskActiveInWeek(task, weekStart) ? marker : ''
      );

      return [...fixedData, ...ganttData];
    });

  // Création du workbook
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Définir la largeur des colonnes
  const colWidths = [
    { wch: 40 }, // Nom
    { wch: 12 }, // Statut
    { wch: 12 }, // Date début
    { wch: 12 }, // Date fin
    { wch: 14 }, // Avancement
    ...weekHeaders.map(() => ({ wch: 6 })), // Colonnes temporelles étroites
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gantt');

  // Génération du fichier
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `gantt-${title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ -]/g, '')}-${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
