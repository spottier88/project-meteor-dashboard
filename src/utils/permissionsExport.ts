/**
 * Export Excel de la revue des droits utilisateurs.
 * Génère un fichier .xlsx avec deux onglets :
 * - Synthèse des droits (une ligne par utilisateur)
 * - Détail affectations managers (une ligne par affectation)
 */
import * as XLSX from "xlsx";
import type { PermissionsReviewUser } from "@/components/admin/PermissionsReviewTable";

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
export const exportPermissionsReview = (users: PermissionsReviewUser[]) => {
  const wb = XLSX.utils.book_new();

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

  const wsSynthese = XLSX.utils.json_to_sheet(syntheseData);
  // Ajuster largeurs de colonnes
  wsSynthese["!cols"] = [
    { wch: 20 }, { wch: 20 }, { wch: 30 },
    { wch: 35 }, { wch: 40 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSynthese, "Synthèse des droits");

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

  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  wsDetail["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsDetail, "Détail managers");

  // Téléchargement
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Revue_droits_${dateStr}.xlsx`);
};
