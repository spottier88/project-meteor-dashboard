/**
 * Utilitaire d'export des évaluations de projets au format Excel
 */

import * as XLSX from "xlsx";
import { EvaluationWithProject } from "@/hooks/useAllEvaluations";

/**
 * Exporte les évaluations au format Excel
 * @param evaluations - Liste des évaluations à exporter
 * @param filename - Nom du fichier (sans extension)
 */
export const exportEvaluationsToExcel = (
  evaluations: EvaluationWithProject[],
  filename: string = "evaluations-projets"
): void => {
  // Préparation des données pour l'export
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

  // Création du classeur Excel
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Ajustement de la largeur des colonnes
  const columnWidths = [
    { wch: 40 }, // Titre du projet
    { wch: 30 }, // Chef de projet
    { wch: 20 }, // Pôle
    { wch: 25 }, // Direction
    { wch: 25 }, // Service
    { wch: 15 }, // Date de clôture
    { wch: 15 }, // Date d'évaluation
    { wch: 50 }, // Ce qui a fonctionné
    { wch: 50 }, // Ce qui a manqué
    { wch: 50 }, // Améliorations proposées
    { wch: 50 }, // Leçons apprises
  ];
  worksheet["!cols"] = columnWidths;

  // Création du classeur et ajout de la feuille
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Évaluations");

  // Génération du fichier avec date dans le nom
  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
};
