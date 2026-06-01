/**
 * Utilitaires d'export Excel pour les pages de statistiques admin.
 * Utilise exceljs (déjà dans le projet). Pour le PDF, on s'appuie
 * sur l'impression navigateur via window.print().
 */
import ExcelJS from "exceljs";
import { ContentStats } from "@/hooks/admin-stats/useContentStats";
import { UsageStats } from "@/hooks/admin-stats/useUsageStats";

const triggerDownload = (buffer: ArrayBuffer, fileName: string) => {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const addKeyValueSheet = (wb: ExcelJS.Workbook, title: string, rows: Array<[string, string | number]>) => {
  const ws = wb.addWorksheet(title.slice(0, 31));
  ws.addRow(["Indicateur", "Valeur"]).font = { bold: true };
  rows.forEach((r) => ws.addRow(r));
  ws.columns.forEach((c) => (c.width = 30));
};

const addTableSheet = (
  wb: ExcelJS.Workbook,
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>
) => {
  const ws = wb.addWorksheet(title.slice(0, 31));
  ws.addRow(headers).font = { bold: true };
  rows.forEach((r) => ws.addRow(r));
  ws.columns.forEach((c) => (c.width = 25));
};

export const exportContentStatsToExcel = async (stats: ContentStats) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "METEOR";
  wb.created = new Date();

  addKeyValueSheet(wb, "Projets", [
    ["Total", stats.projects.total],
    ["En cours", stats.projects.in_progress],
    ["Terminés", stats.projects.completed],
    ["Étude", stats.projects.study],
    ["Validés", stats.projects.validated],
    ["Suspendus", stats.projects.suspended],
    ["Innovants", stats.projects.innovative],
    ["Avancement moyen (%)", stats.weather.avg_completion],
    ["Sans revue >30j", stats.missing_reviews],
  ]);

  addKeyValueSheet(wb, "Météo", [
    ["Beau", stats.weather.sunny],
    ["Nuageux", stats.weather.cloudy],
    ["Orageux", stats.weather.stormy],
    ["Inconnu", stats.weather.unknown],
  ]);

  addTableSheet(wb, "Par pôle", ["Pôle", "Nb projets"], stats.by_pole.map((p) => [p.name, p.count]));
  addTableSheet(
    wb,
    "Par direction",
    ["Direction", "Nb projets"],
    stats.by_direction.map((d) => [d.name, d.count])
  );

  addKeyValueSheet(wb, "Tâches & risques", [
    ["Tâches - total", stats.tasks.total],
    ["Tâches - terminées", stats.tasks.done],
    ["Tâches - en retard", stats.tasks.overdue],
    ["Risques - total", stats.risks.total],
    ["Risques - ouverts", stats.risks.open_count],
    ["Risques - critiques", stats.risks.critical],
    ["Revues - total", stats.reviews.total],
    ["Projets avec revue", stats.reviews.projects_reviewed],
  ]);

  addKeyValueSheet(wb, "Organisation", [
    ["Pôles", stats.org.poles],
    ["Directions", stats.org.directions],
    ["Services", stats.org.services],
    ["Utilisateurs actifs", stats.org.active_users],
    ["Utilisateurs inactifs", stats.org.inactive_users],
  ]);

  addTableSheet(wb, "Rôles", ["Rôle", "Nb utilisateurs"], stats.roles.map((r) => [r.role, r.count]));
  addTableSheet(
    wb,
    "Top chefs de projet",
    ["Chef de projet", "Email", "Nb projets"],
    stats.top_pms.map((p) => [p.name, p.email, p.count])
  );

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, `stats-contenu-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportUsageStatsToExcel = async (stats: UsageStats) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "METEOR";
  wb.created = new Date();

  addKeyValueSheet(wb, "Utilisateurs actifs", [
    ["DAU (24h)", stats.active.dau],
    ["WAU (7j)", stats.active.wau],
    ["MAU (30j)", stats.active.mau],
    ["Comptes actifs total", stats.active.total_active_accounts],
    ["Comptes inactifs >30j", stats.inactive_accounts],
  ]);

  addKeyValueSheet(
    wb,
    "Événements (période)",
    Object.entries(stats.events).map(([k, v]) => [k, v])
  );

  addTableSheet(
    wb,
    "Actifs par jour",
    ["Jour", "Utilisateurs actifs"],
    stats.daily_active.map((d) => [d.day, d.active_users])
  );

  addTableSheet(
    wb,
    "Événements par jour",
    ["Jour", "Type", "Nb"],
    stats.daily_events.map((d) => [d.day, d.event_type, d.count])
  );

  addTableSheet(
    wb,
    "Top utilisateurs",
    ["Nom", "Email", "Nb actions"],
    stats.top_users.map((u) => [u.name, u.email, u.actions])
  );

  addTableSheet(
    wb,
    "Top projets",
    ["Projet", "Nb événements"],
    stats.top_projects.map((p) => [p.title, p.events])
  );

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, `stats-usage-${new Date().toISOString().slice(0, 10)}.xlsx`);
};
