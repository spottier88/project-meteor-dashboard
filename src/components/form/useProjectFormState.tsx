import { useState, useEffect } from "react";

export const useProjectFormState = (isOpen: boolean, project?: any) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectManager, setProjectManager] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{
    pole: string | null;
    direction: string | null;
    service: string | null;
  }>({
    pole: null,
    direction: null,
    service: null,
  });
  const [lifecycleStatus, setLifecycleStatus] = useState<string>("study");
  const [forEntity, setForEntity] = useState<{
    type: string | null;
    id: string | null;
  }>({
    type: null,
    id: null,
  });
  const [suiviDGS, setSuiviDGS] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Initialisation des états à partir des props "project" en mode édition
  useEffect(() => {
    if (isOpen && project) {
      setTitle(project.title || "");
      setDescription(project.description || "");
      setProjectManager(project.project_manager || null);
      setStartDate(project.start_date ? new Date(project.start_date) : null);
      setEndDate(project.end_date ? new Date(project.end_date) : null);
      setStatus(project.status || null);
      setProgress(project.progress || null);
      setPriority(project.priority || null);
      setOrganization({
        pole: project.pole_id || null,
        direction: project.direction_id || null,
        service: project.service_id || null,
      });
      setLifecycleStatus(project.lifecycle_status || "study");
      setForEntity({
        type: project.for_entity_type || null,
        id: project.for_entity_id || null,
      });
      setSuiviDGS(project.suivi_dgs || false);
    }
  }, [isOpen, project]);

  const resetHasUnsavedChanges = () => {
    setHasUnsavedChanges(false);
  };

  // Surveiller les changements pour mettre à jour hasUnsavedChanges
  useEffect(() => {
    if (!isOpen) return;

    // Pour une nouvelle création, il n'y a pas besoin de vérifier les changements
    if (!project) {
      setHasUnsavedChanges(
        !!title ||
        !!description ||
        !!projectManager ||
        !!startDate ||
        !!endDate ||
        !!status ||
        !!progress ||
        !!priority ||
        !!organization.pole ||
        !!organization.direction ||
        !!organization.service ||
        lifecycleStatus !== "study" ||
        !!forEntity.type ||
        !!forEntity.id ||
        suiviDGS ||
        !!selectedTemplateId
      );
      return;
    }

    const hasTitleChanged = title !== (project.title || "");
    const hasDescriptionChanged = description !== (project.description || "");
    const hasProjectManagerChanged = projectManager !== (project.project_manager || null);
    const hasStartDateChanged = startDate ? startDate.getTime() !== new Date(project.start_date || "").getTime() : !!project.start_date;
    const hasEndDateChanged = endDate ? endDate.getTime() !== new Date(project.end_date || "").getTime() : !!project.end_date;
    const hasStatusChanged = status !== (project.status || null);
    const hasProgressChanged = progress !== (project.progress || null);
    const hasPriorityChanged = priority !== (project.priority || null);
    const hasPoleChanged = organization.pole !== (project.pole_id || null);
    const hasDirectionChanged = organization.direction !== (project.direction_id || null);
    const hasServiceChanged = organization.service !== (project.service_id || null);
    const hasLifecycleStatusChanged = lifecycleStatus !== (project.lifecycle_status || "study");
    const hasForEntityTypeChanged = forEntity.type !== (project.for_entity_type || null);
    const hasForEntityIdChanged = forEntity.id !== (project.for_entity_id || null);
    const hasSuiviDGSChanged = suiviDGS !== (project.suivi_dgs || false);
    const hasTemplateIdChanged = selectedTemplateId !== null;

    setHasUnsavedChanges(
      hasTitleChanged ||
      hasDescriptionChanged ||
      hasProjectManagerChanged ||
      hasStartDateChanged ||
      hasEndDateChanged ||
      hasStatusChanged ||
      hasProgressChanged ||
      hasPriorityChanged ||
      hasPoleChanged ||
      hasDirectionChanged ||
      hasServiceChanged ||
      hasLifecycleStatusChanged ||
      hasForEntityTypeChanged ||
      hasForEntityIdChanged ||
      hasSuiviDGSChanged ||
      hasTemplateIdChanged
    );
  }, [
    title,
    description,
    projectManager,
    startDate,
    endDate,
    status,
    progress,
    priority,
    organization.pole,
    organization.direction,
    organization.service,
    lifecycleStatus,
    forEntity.type,
    forEntity.id,
    suiviDGS,
    selectedTemplateId,
    isOpen,
    project,
  ]);

  return {
    title,
    setTitle,
    description,
    setDescription,
    projectManager,
    setProjectManager,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    status,
    setStatus,
    progress,
    setProgress,
    priority,
    setPriority,
    organization,
    setOrganization,
    lifecycleStatus,
    setLifecycleStatus,
    forEntity,
    setForEntity,
    suiviDGS,
    setSuiviDGS,
    hasUnsavedChanges,
    resetHasUnsavedChanges,
    currentStep,
    setCurrentStep,
    isSubmitting,
    setIsSubmitting,
    selectedTemplateId,
    setSelectedTemplateId,
  };
};
