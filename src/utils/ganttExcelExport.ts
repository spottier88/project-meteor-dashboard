/**
 * @file ganttExcelExport.ts
 * @description Export Excel avec visualisation Gantt colorée pour les tâches d'un projet.
 * Utilise ExcelJS pour générer un fichier Excel avec mise en forme avancée :
 * couleurs de fond, bordures, gel des volets, légende, etc.
 * Compatible avec le format SVAR Gantt.
 */

import ExcelJS from 'exceljs';
import { startOfWeek, startOfMonth, startOfYear, addWeeks, addMonths, addYears, addDays, format, endOfMonth, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Format simplifié des tâches pour l'export */
export interface ExportableTask {
  id?: string;
  parentId?: string | null;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: string;
  /** Indique si la tâche est une tâche parente (possède des sous-tâches) */
  isParent?: boolean;
  /** Niveau hiérarchique (0 = racine, 1 = enfant) – calculé automatiquement */
  level?: number;
}

/**
 * Ordonne les tâches en arborescence : chaque parent est suivi de ses enfants.
 * Conserve l'ordre d'origine (déjà trié par order_index) au sein de chaque niveau.
 */
const buildHierarchicalOrder = (tasks: ExportableTask[]): ExportableTask[] => {
  const roots: ExportableTask[] = [];
  const childrenMap = new Map<string, ExportableTask[]>();

  // Séparer racines et enfants
  tasks.forEach(t => {
    if (t.parentId) {
      const siblings = childrenMap.get(t.parentId) || [];
      siblings.push({ ...t, level: 1 });
      childrenMap.set(t.parentId, siblings);
    } else {
      roots.push({ ...t, level: 0 });
    }
  });

  // Intercaler les enfants juste après leur parent
  const result: ExportableTask[] = [];
  roots.forEach(root => {
    result.push(root);
    const children = root.id ? childrenMap.get(root.id) : undefined;
    if (children) {
      result.push(...children);
    }
  });

  return result;
};

/** Mode de vue pour l'export */
type ViewModeKey = 'day' | 'week' | 'month' | 'year';

/** Couleurs ARGB pour les statuts des tâches */
const STATUS_COLORS = {
  done: 'FF22C55E',
  inProgress: 'FF3B82F6',
  todo: 'FFE2E8F0',
} as const;

/** Couleurs de texte pour la colonne Statut */
const STATUS_TEXT_COLORS = {
  done: 'FF16A34A',
  inProgress: 'FF2563EB',
  todo: 'FF64748B',
} as const;

const HEADER_BG = 'FF4B5563';
const HEADER_FG = 'FFFFFFFF';

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
};

/**
 * Retourne le libellé français et la couleur selon la progression
 */
const getStatusInfo = (task: ExportableTask) => {
  if (task.progress === 100) return { label: 'Terminé', color: STATUS_COLORS.done, textColor: STATUS_TEXT_COLORS.done };
  if (task.progress > 0) return { label: 'En cours', color: STATUS_COLORS.inProgress, textColor: STATUS_TEXT_COLORS.inProgress };
  return { label: 'À faire', color: STATUS_COLORS.todo, textColor: STATUS_TEXT_COLORS.todo };
};

/**
 * Calcule la plage temporelle globale avec marge
 */
const getDateRange = (tasks: ExportableTask[]): { start: Date; end: Date } => {
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
 * Génère la liste des périodes couvrant la plage temporelle
 */
const generatePeriodStarts = (start: Date, end: Date, viewMode: ViewModeKey): Date[] => {
  const periods: Date[] = [];
  let current: Date;

  switch (viewMode) {
    case 'day':
      current = new Date(start);
      current.setHours(0, 0, 0, 0);
      while (current <= end) {
        periods.push(new Date(current));
        current = addDays(current, 1);
      }
      break;
    case 'month':
      current = startOfMonth(start);
      while (current <= end) {
        periods.push(new Date(current));
        current = addMonths(current, 1);
      }
      break;
    case 'year':
      current = startOfYear(start);
      while (current <= end) {
        periods.push(new Date(current));
        current = addYears(current, 1);
      }
      break;
    case 'week':
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
 * Vérifie si une tâche est active durant une période donnée
 */
const isTaskActiveInPeriod = (task: ExportableTask, periodStart: Date, viewMode: ViewModeKey): boolean => {
  let periodEnd: Date;
  switch (viewMode) {
    case 'day':
      periodEnd = new Date(periodStart);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    case 'month':
      periodEnd = endOfMonth(periodStart);
      break;
    case 'year':
      periodEnd = endOfYear(periodStart);
      break;
    case 'week':
    default:
      periodEnd = addDays(periodStart, 6);
      break;
  }
  return task.start <= periodEnd && task.end >= periodStart;
};

/**
 * Formate l'en-tête d'une période
 */
const formatPeriodHeader = (date: Date, viewMode: ViewModeKey): string => {
  switch (viewMode) {
    case 'day':
      return format(date, 'dd/MM/yy', { locale: fr });
    case 'month':
      return format(date, 'MMM yyyy', { locale: fr });
    case 'year':
      return format(date, 'yyyy', { locale: fr });
    case 'week':
    default:
      return format(date, 'dd/MM/yy', { locale: fr });
  }
};

/**
 * Exporte les tâches du Gantt vers un fichier Excel avec mise en forme avancée
 * @param tasks - Liste des tâches au format simplifié
 * @param projectTitle - Titre du projet pour le nom du fichier
 * @param viewMode - Mode de vue sélectionné
 */
export const exportGanttToExcel = async (
  tasks: ExportableTask[],
  projectTitle?: string,
  viewMode: ViewModeKey = 'week',
  exportContext: 'project' | 'portfolio' | 'cart' = 'project'
): Promise<void> => {
  if (tasks.length === 0) return;

  const title = projectTitle || 'Projet';
  const { start, end } = getDateRange(tasks);
  const periodStarts = generatePeriodStarts(start, end, viewMode);
  // Exclure les projets, puis ordonner en arborescence parent → enfants
  const filteredTasks = buildHierarchicalOrder(tasks.filter(t => t.type !== 'project'));

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Gantt', {
    views: [{ state: 'frozen' as const, xSplit: 5, ySplit: 2 }],
  });

  const fixedHeaders = ['Nom', 'Statut', 'Date début', 'Date fin', 'Avancement (%)'];
  const periodHeaders = periodStarts.map(p => formatPeriodHeader(p, viewMode));
  const totalCols = fixedHeaders.length + periodHeaders.length;

  // --- Ligne 1 : Titre ---
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

  // --- Lignes de données ---
  filteredTasks.forEach((task, idx) => {
    const rowNum = idx + 3;
    const row = ws.getRow(rowNum);
    const statusInfo = getStatusInfo(task);

    const nameCell = row.getCell(1);
    const isChild = (task.level ?? 0) > 0;
    nameCell.value = task.isParent ? `▸ ${task.name}` : isChild ? `    ↳ ${task.name}` : task.name;
    nameCell.font = { size: 10, bold: !!task.isParent };
    nameCell.alignment = { vertical: 'middle' };
    nameCell.border = thinBorder;
    // Fond gris clair pour les tâches parentes
    if (task.isParent) {
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    }

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
  const colWidth = viewMode === 'day' ? 8 : viewMode === 'year' ? 8 : viewMode === 'month' ? 10 : 8;
  periodStarts.forEach((_, i) => {
    ws.getColumn(6 + i).width = colWidth;
  });

  // --- Légende ---
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

  // --- Téléchargement ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ -]/g, '');
  const filePrefix = exportContext === 'project' ? `gantt-${sanitizedTitle}` : 'gantt-projets';
  link.href = url;
  link.download = `${filePrefix}-${dateStr}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};
