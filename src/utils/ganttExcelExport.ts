/**
 * @file ganttExcelExport.ts
 * @description Export Excel avec visualisation Gantt colorée pour les tâches d'un projet.
 * Utilise ExcelJS pour générer un fichier Excel avec mise en forme avancée :
 * couleurs de fond, bordures, gel des volets, légende, etc.
 */

import ExcelJS from 'exceljs';
import { Task, ViewMode } from 'gantt-task-react';
import { startOfWeek, startOfMonth, startOfYear, addWeeks, addMonths, addYears, addDays, format, endOfMonth, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Couleurs ARGB pour les statuts des tâches */
const STATUS_COLORS = {
  done: 'FF22C55E',      // Vert
  inProgress: 'FF3B82F6', // Bleu
  todo: 'FFE2E8F0',       // Gris clair
} as const;

/** Couleurs de texte pour la colonne Statut */
const STATUS_TEXT_COLORS = {
  done: 'FF16A34A',
  inProgress: 'FF2563EB',
  todo: 'FF64748B',
} as const;

/** Couleur d'en-tête */
const HEADER_BG = 'FF4B5563';
const HEADER_FG = 'FFFFFFFF';

/** Bordure fine standard */
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
};

/**
 * Retourne le libellé français et la couleur selon le statut
 */
const getStatusInfo = (task: Task) => {
  if (task.progress === 100) return { label: 'Terminé', color: STATUS_COLORS.done, textColor: STATUS_TEXT_COLORS.done };
  if (task.progress > 0) return { label: 'En cours', color: STATUS_COLORS.inProgress, textColor: STATUS_TEXT_COLORS.inProgress };
  return { label: 'À faire', color: STATUS_COLORS.todo, textColor: STATUS_TEXT_COLORS.todo };
};

/**
 * Calcule la plage temporelle globale avec marge d'une semaine
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
  return {
    start: startOfWeek(addDays(minDate, -7), { weekStartsOn: 1 }),
    end: addWeeks(startOfWeek(maxDate, { weekStartsOn: 1 }), 2),
  };
};

/**
 * Génère la liste des périodes couvrant la plage temporelle selon le mode de vue
 */
const generatePeriodStarts = (start: Date, end: Date, viewMode: ViewMode): Date[] => {
  const periods: Date[] = [];
  let current: Date;

  switch (viewMode) {
    case ViewMode.Day:
      current = new Date(start);
      current.setHours(0, 0, 0, 0);
      while (current <= end) {
        periods.push(new Date(current));
        current = addDays(current, 1);
      }
      break;
    case ViewMode.Month:
      current = startOfMonth(start);
      while (current <= end) {
        periods.push(new Date(current));
        current = addMonths(current, 1);
      }
      break;
    case ViewMode.Year:
      current = startOfYear(start);
      while (current <= end) {
        periods.push(new Date(current));
        current = addYears(current, 1);
      }
      break;
    case ViewMode.Week:
    default:
      current = startOfWeek(start, { weekStartsOn: 1 });
      while (current <= end) {
        periods.push(new Date(current));
        current = addWeeks(current, 1);
      }
      break;
  }
  return periods;
};

/**
 * Vérifie si une tâche est active durant une période donnée selon le mode de vue
 */
const isTaskActiveInPeriod = (task: Task, periodStart: Date, viewMode: ViewMode): boolean => {
  let periodEnd: Date;
  switch (viewMode) {
    case ViewMode.Day:
      periodEnd = new Date(periodStart);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    case ViewMode.Month:
      periodEnd = endOfMonth(periodStart);
      break;
    case ViewMode.Year:
      periodEnd = endOfYear(periodStart);
      break;
    case ViewMode.Week:
    default:
      periodEnd = addDays(periodStart, 6);
      break;
  }
  return task.start <= periodEnd && task.end >= periodStart;
};

/**
 * Formate l'en-tête d'une période selon le mode de vue
 */
const formatPeriodHeader = (date: Date, viewMode: ViewMode): string => {
  switch (viewMode) {
    case ViewMode.Day:
      return format(date, 'dd/MM/yy', { locale: fr });
    case ViewMode.Month:
      return format(date, 'MMM yyyy', { locale: fr });
    case ViewMode.Year:
      return format(date, 'yyyy', { locale: fr });
    case ViewMode.Week:
    default:
      return format(date, 'dd/MM/yy', { locale: fr });
  }
};

/**
 * Exporte les tâches du Gantt vers un fichier Excel avec mise en forme avancée
 * @param tasks - Liste des tâches au format gantt-task-react
 * @param projectTitle - Titre du projet pour le nom du fichier et la ligne de titre
 * @param viewMode - Mode de vue sélectionné (Day, Week, Month, Year)
 */
export const exportGanttToExcel = async (tasks: Task[], projectTitle?: string, viewMode: ViewMode = ViewMode.Week): Promise<void> => {
  if (tasks.length === 0) return;

  const title = projectTitle || 'Projet';
  const { start, end } = getDateRange(tasks);
  const periodStarts = generatePeriodStarts(start, end, viewMode);
  const filteredTasks = tasks.filter(t => t.type !== 'project');

  // Création du workbook et de la feuille
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Gantt', {
    views: [{ state: 'frozen' as const, xSplit: 5, ySplit: 2 }],
  });

  const fixedHeaders = ['Nom', 'Statut', 'Date début', 'Date fin', 'Avancement (%)'];
  const periodHeaders = periodStarts.map(p => formatPeriodHeader(p, viewMode));
  const totalCols = fixedHeaders.length + periodHeaders.length;

  // --- Ligne 1 : Titre du projet fusionné ---
  ws.mergeCells(1, 1, 1, totalCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `📊 Gantt – ${title}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F2937' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 30;

  // --- Ligne 2 : En-têtes ---
  const headerRow = ws.getRow(2);
  const allHeaders = [...fixedHeaders, ...periodHeaders];
  allHeaders.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: HEADER_FG } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });
  headerRow.height = 22;

  // --- Lignes de données (à partir de la ligne 3) ---
  filteredTasks.forEach((task, idx) => {
    const rowNum = idx + 3;
    const row = ws.getRow(rowNum);
    const statusInfo = getStatusInfo(task);

    // Colonnes fixes
    const nameCell = row.getCell(1);
    nameCell.value = task.name;
    nameCell.font = { size: 10 };
    nameCell.alignment = { vertical: 'middle' };
    nameCell.border = thinBorder;

    const statusCell = row.getCell(2);
    statusCell.value = statusInfo.label;
    statusCell.font = { bold: true, size: 10, color: { argb: statusInfo.textColor } };
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    statusCell.border = thinBorder;

    const startCell = row.getCell(3);
    startCell.value = format(task.start, 'dd/MM/yyyy', { locale: fr });
    startCell.font = { size: 10 };
    startCell.alignment = { vertical: 'middle', horizontal: 'center' };
    startCell.border = thinBorder;

    const endCell = row.getCell(4);
    endCell.value = format(task.end, 'dd/MM/yyyy', { locale: fr });
    endCell.font = { size: 10 };
    endCell.alignment = { vertical: 'middle', horizontal: 'center' };
    endCell.border = thinBorder;

    const progressCell = row.getCell(5);
    progressCell.value = Math.round(task.progress);
    progressCell.font = { size: 10 };
    progressCell.alignment = { vertical: 'middle', horizontal: 'center' };
    progressCell.border = thinBorder;

    // Colonnes Gantt temporelles
    periodStarts.forEach((periodStart, pIdx) => {
      const cell = row.getCell(6 + pIdx);
      cell.border = thinBorder;
      if (isTaskActiveInPeriod(task, periodStart, viewMode)) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusInfo.color } };
      }
    });
  });

  // --- Largeurs de colonnes ---
  ws.getColumn(1).width = 40;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 14;
  // Largeur des colonnes temporelles selon le mode
  const colWidth = viewMode === ViewMode.Day ? 8 : viewMode === ViewMode.Year ? 8 : viewMode === ViewMode.Month ? 10 : 8;
  periodStarts.forEach((_, i) => {
    ws.getColumn(6 + i).width = colWidth;
  });

  // --- Légende en bas ---
  const legendStart = filteredTasks.length + 4;
  ws.getCell(legendStart, 1).value = 'Légende :';
  ws.getCell(legendStart, 1).font = { bold: true, size: 10 };

  const legendItems = [
    { label: 'À faire', color: STATUS_COLORS.todo },
    { label: 'En cours', color: STATUS_COLORS.inProgress },
    { label: 'Terminé', color: STATUS_COLORS.done },
  ];
  legendItems.forEach((item, i) => {
    const r = legendStart + 1 + i;
    const colorCell = ws.getCell(r, 1);
    colorCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.color } };
    colorCell.border = thinBorder;
    ws.getCell(r, 2).value = item.label;
    ws.getCell(r, 2).font = { size: 10 };
  });

  // --- Génération et téléchargement du fichier ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  link.href = url;
  link.download = `gantt-${title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ -]/g, '')}-${dateStr}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};
