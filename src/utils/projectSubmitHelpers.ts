/**
 * @module projectSubmitHelpers
 * @description Fonctions utilitaires extraites de useProjectSubmit pour la sauvegarde
 * des données annexes d'un projet (innovation, monitoring, cadrage, portefeuilles).
 */

import { supabase } from "@/integrations/supabase/client";
import { ProjectFormState } from "@/components/form/useProjectFormState";

/**
 * Sauvegarde les scores d'innovation d'un projet (upsert ou insert).
 */
export const saveInnovationScores = async (
  projectId: string,
  formState: ProjectFormState,
  mode: "upsert" | "insert" = "upsert"
) => {
  const payload = {
    project_id: projectId,
    novateur: formState.novateur || 0,
    usager: formState.usager || 0,
    ouverture: formState.ouverture || 0,
    agilite: formState.agilite || 0,
    impact: formState.impact || 0,
  };

  const { error } = mode === "upsert"
    ? await supabase.from("project_innovation_scores").upsert(payload, { onConflict: "project_id" })
    : await supabase.from("project_innovation_scores").insert(payload);

  if (error) {
    console.error("❌ Erreur sauvegarde innovation:", error);
    if (mode === "insert") throw error;
  }
};

/**
 * Sauvegarde le niveau de monitoring d'un projet (upsert ou insert).
 */
export const saveMonitoring = async (
  projectId: string,
  formState: ProjectFormState,
  getMonitoringEntityId: (level: string) => string | null,
  mode: "upsert" | "insert" = "upsert"
) => {
  if (formState.monitoringLevel === undefined) return;

  const payload = {
    project_id: projectId,
    monitoring_level: formState.monitoringLevel,
    monitoring_entity_id: getMonitoringEntityId(formState.monitoringLevel),
  };

  const { error } = mode === "upsert"
    ? await supabase.from("project_monitoring").upsert(payload, { onConflict: "project_id" })
    : await supabase.from("project_monitoring").insert(payload);

  if (error) {
    console.error("❌ Erreur sauvegarde monitoring:", error);
    if (mode === "insert") throw error;
  }
};

/**
 * Sauvegarde les données de cadrage d'un projet (upsert ou insert).
 */
export const saveFraming = async (
  projectId: string,
  formState: ProjectFormState,
  mode: "upsert" | "insert" = "upsert"
) => {
  const hasFramingData = formState.context || formState.objectives || formState.governance ||
    formState.deliverables || formState.stakeholders || formState.timeline;

  if (!hasFramingData) return;

  const payload = {
    project_id: projectId,
    context: formState.context,
    objectives: formState.objectives,
    governance: formState.governance,
    deliverables: formState.deliverables,
    stakeholders: formState.stakeholders,
    timeline: formState.timeline,
  };

  const { error } = mode === "upsert"
    ? await supabase.from("project_framing").upsert(payload, { onConflict: "project_id" })
    : await supabase.from("project_framing").insert(payload);

  if (error) {
    console.error("❌ Erreur sauvegarde cadrage:", error);
  }
};

/**
 * Synchronise les portefeuilles d'un projet (stratégie diff pour update, insert pour création).
 */
export const savePortfolios = async (
  projectId: string,
  portfolioIds: string[],
  ownerId: string | null,
  mode: "sync" | "insert" = "sync"
) => {
  if (mode === "insert") {
    if (portfolioIds.length === 0) return;
    const { error } = await supabase
      .from("portfolio_projects")
      .insert(portfolioIds.map(portfolioId => ({
        project_id: projectId,
        portfolio_id: portfolioId,
        added_by: ownerId,
      })));
    if (error) console.error("❌ Erreur ajout portefeuilles:", error);
    return;
  }

  // Mode sync : diff entre état actuel et souhaité
  const { data: currentLinks } = await supabase
    .from("portfolio_projects")
    .select("portfolio_id")
    .eq("project_id", projectId);

  const currentIds = currentLinks?.map(l => l.portfolio_id) || [];
  const toAdd = portfolioIds.filter(id => !currentIds.includes(id));
  const toRemove = currentIds.filter(id => !portfolioIds.includes(id));

  if (toAdd.length > 0) {
    await supabase.from("portfolio_projects").insert(
      toAdd.map(portfolioId => ({ project_id: projectId, portfolio_id: portfolioId, added_by: ownerId }))
    );
  }

  if (toRemove.length > 0) {
    await supabase.from("portfolio_projects").delete().eq("project_id", projectId).in("portfolio_id", toRemove);
  }
};
