/**
 * Utilitaire d'export des évaluations de projets au format Excel via ExcelJS
 */
import ExcelJS from 'exceljs';
import { EvaluationWithProject } from "@/hooks/useAllEvaluations";
import { downloadWorkbook, addJsonSheet } from './excelDownload';

/**
 * Exporte les évaluations au format Excel
 * @param evaluations - Liste des évaluations à exporter
 * @param filename - Nom du fichier (sans extension)
 */
export const exportEvaluationsToExcel = async (
  evaluations: EvaluationWithProject[],
  filename: string = "evaluations-projets"
): Promise<void> => {
  const exportData = evaluations.map((evaluation) => ({
    "Titre du projet": evaluation.project?.title || "Projet inconnu",
    "Chef de projet": evaluation.project?.project_manager || "-",
    "Pôle": evaluation.project?.pole?.name || "-",
    "Direction": evaluation.project?.direction?.name || "-",
    "Service": evaluation.project?.service?.name || "-",
    "Date de clôture": evaluation.project?.closed_at
      ? new Date(evaluation.project.closed_at).toLocaleDateString("fr-FR")
      : "-",
    "Date d'évaluation": evaluation.created_at
      ? new Date(evaluation.created_at).toLocaleDateString("fr-FR")
      : "-",
    "Ce qui a fonctionné": evaluation.what_worked || "",
    "Ce qui a manqué": evaluation.what_was_missing || "",
    "Améliorations proposées": evaluation.improvements || "",
    "Leçons apprises": evaluation.lessons_learned || "",
  }));

  const wb = new ExcelJS.Workbook();
  addJsonSheet(wb, "Évaluations", exportData, [40, 30, 20, 25, 25, 15, 15, 50, 50, 50, 50]);

  const dateStr = new Date().toISOString().split("T")[0];
  await downloadWorkbook(wb, `${filename}_${dateStr}.xlsx`);
};
