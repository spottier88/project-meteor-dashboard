/**
 * Export Excel de la revue des droits utilisateurs via ExcelJS.
 * Génère un fichier .xlsx avec deux onglets :
 * - Synthèse des droits (une ligne par utilisateur)
 * - Détail affectations managers (une ligne par affectation)
 */
import ExcelJS from 'exceljs';
import type { PermissionsReviewUser } from "@/components/admin/PermissionsReviewTable";
import { downloadWorkbook, addJsonSheet } from './excelDownload';

/** Labels lisibles pour chaque rôle */
const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: "Administrateur",
    chef_projet: "Chef de projet",
    manager: "Manager",
    membre: "Membre",
    time_tracker: "Suivi activités",
    portfolio_manager: "Gestionnaire de portefeuille",
    quality_manager: "Responsable Qualité",
  };
  return labels[role] || role;
};

/** Formatage date pour l'export */
const formatDate = (date?: Date): string => {
  if (!date) return "Aucune activité";
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
};

/**
 * Exporte la revue des droits en fichier Excel (.xlsx).
 * @param users - Liste consolidée des utilisateurs avec rôles et affectations
 */
export const exportPermissionsReview = async (users: PermissionsReviewUser[]) => {
  const wb = new ExcelJS.Workbook();

  // --- Onglet 1 : Synthèse des droits ---
  const syntheseData = users.map((u) => ({
    Nom: u.last_name || "",
    Prénom: u.first_name || "",
    Email: u.email || "",
    Rôles: [...new Set(u.roles)].map(getRoleLabel).join(", "),
    "Affectations hiérarchiques": u.hierarchyPaths.length > 0
      ? u.hierarchyPaths.join("\n")
      : u.roles.includes("manager") ? "(aucune)" : "-",
    "Dernière activité": formatDate(u.lastActivity),
  }));

  addJsonSheet(wb, "Synthèse des droits", syntheseData, [20, 20, 30, 35, 40, 20]);

  // --- Onglet 2 : Détail affectations managers ---
  const detailData: { Nom: string; Prénom: string; Email: string; "Chemin hiérarchique": string }[] = [];
  users.forEach((u) => {
    if (!u.roles.includes("manager")) return;
    if (u.hierarchyPaths.length === 0) {
      detailData.push({
        Nom: u.last_name || "",
        Prénom: u.first_name || "",
        Email: u.email || "",
        "Chemin hiérarchique": "(aucune affectation)",
      });
    } else {
      u.hierarchyPaths.forEach((path) => {
        detailData.push({
          Nom: u.last_name || "",
          Prénom: u.first_name || "",
          Email: u.email || "",
          "Chemin hiérarchique": path,
        });
      });
    }
  });

  addJsonSheet(wb, "Détail managers", detailData, [20, 20, 30, 50]);

  // Téléchargement
  const dateStr = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(wb, `Revue_droits_${dateStr}.xlsx`);
};
