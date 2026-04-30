/**
 * Utilitaire de téléchargement de fichiers Excel via ExcelJS
 * Convertit un Workbook ExcelJS en téléchargement navigateur
 */
import ExcelJS from 'exceljs';

/**
 * Télécharge un classeur ExcelJS sous forme de fichier .xlsx
 * @param workbook - Classeur ExcelJS à télécharger
 * @param filename - Nom du fichier (avec extension .xlsx)
 */
export const downloadWorkbook = async (workbook: ExcelJS.Workbook, filename: string): Promise<void> => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Crée une feuille ExcelJS à partir d'un tableau d'objets (équivalent json_to_sheet)
 * @param workbook - Classeur ExcelJS
 * @param sheetName - Nom de l'onglet
 * @param data - Tableau d'objets dont les clés deviennent les en-têtes
 * @param columnWidths - Largeurs des colonnes (optionnel)
 * @returns La feuille créée
 */
export const addJsonSheet = (
  workbook: ExcelJS.Workbook,
  sheetName: string,
  data: Record<string, string | number | boolean | null | undefined>[],
  columnWidths?: number[]
): ExcelJS.Worksheet => {
  const ws = workbook.addWorksheet(sheetName);

  if (data.length === 0) return ws;

  // Définir les colonnes à partir des clés du premier objet
  const keys = Object.keys(data[0]);
  ws.columns = keys.map((key, i) => ({
    header: key,
    key,
    width: columnWidths?.[i] ?? 15,
  }));

  // Mettre les en-têtes en gras
  ws.getRow(1).font = { bold: true };

  // Ajouter les lignes de données
  data.forEach((row) => ws.addRow(row));

  return ws;
};

/**
 * Crée une feuille ExcelJS à partir d'un tableau 2D (équivalent aoa_to_sheet)
 * @param workbook - Classeur ExcelJS
 * @param sheetName - Nom de l'onglet
 * @param rows - Tableau 2D de valeurs
 * @param columnWidths - Largeurs des colonnes (optionnel)
 * @returns La feuille créée
 */
export const addArraySheet = (
  workbook: ExcelJS.Workbook,
  sheetName: string,
  rows: (string | number | null | undefined)[][],
  columnWidths?: number[]
): ExcelJS.Worksheet => {
  const ws = workbook.addWorksheet(sheetName);

  // Ajouter chaque ligne
  rows.forEach((row) => ws.addRow(row));

  // Appliquer les largeurs de colonnes
  if (columnWidths) {
    columnWidths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
  }

  return ws;
};
