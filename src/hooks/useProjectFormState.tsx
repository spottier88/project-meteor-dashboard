import { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { MonitoringLevel } from "@/types/monitoring";
import { ForEntityType, ProjectLifecycleStatus } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectFormState {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  projectManager: string;
  setProjectManager: (manager: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  priority: string;
  setPriority: (priority: string) => void;
  monitoringLevel: MonitoringLevel;
  setMonitoringLevel: (level: MonitoringLevel) => void;
  monitoringEntityId: string | null;
  setMonitoringEntityId: (id: string | null) => void;
  ownerId: string;
  setOwnerId: (id: string) => void;
  projectManagerOrganization: {
    pole?: { id: string; name: string } | null;
    direction?: { id: string; name: string } | null;
    service?: { id: string; name: string } | null;
  };
  loadProjectManagerOrganization: (email: string) => Promise<void>;
  novateur: number;
  setNovateur: (value: number) => void;
  usager: number;
  setUsager: (value: number) => void;
  ouverture: number;
  setOuverture: (value: number) => void;
  agilite: number;
  setAgilite: (value: number) => void;
  impact: number;
  setImpact: (value: number) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  lifecycleStatus: ProjectLifecycleStatus;
  setLifecycleStatus: (status: ProjectLifecycleStatus) => void;
  validateStep3: () => boolean;
  context: string;
  setContext: (value: string) => void;
  stakeholders: string;
  setStakeholders: (value: string) => void;
  governance: string;
  setGovernance: (value: string) => void;
  objectives: string;
  setObjectives: (value: string) => void;
  timeline: string;
  setTimeline: (value: string) => void;
  deliverables: string;
  setDeliverables: (value: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  resetHasUnsavedChanges: () => void;
  hasNoHierarchyAssignment: boolean;
  forEntityType: ForEntityType;
  setForEntityType: (value: ForEntityType) => void;
  forEntityId: string | undefined;
  setForEntityId: (value: string | undefined) => void;
  templateId: string | undefined;
  setTemplateId: (value: string | undefined) => void;
}

export const useProjectFormState = (isOpen: boolean, project?: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState("medium");
  const [monitoringLevel, setMonitoringLevel] = useState<MonitoringLevel>("none");
  const [monitoringEntityId, setMonitoringEntityId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState("");
  const [projectManagerOrganization, setProjectManagerOrganization] = useState<{
    pole?: { id: string; name: string } | null;
    direction?: { id: string; name: string } | null;
    service?: { id: string; name: string } | null;
  }>({});
  const [novateur, setNovateur] = useState(0);
  const [usager, setUsager] = useState(0);
  const [ouverture, setOuverture] = useState(0);
  const [agilite, setAgilite] = useState(0);
  const [impact, setImpact] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lifecycleStatus, setLifecycleStatus] = useState<ProjectLifecycleStatus>("study");
  const [context, setContext] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [governance, setGovernance] = useState("");
  const [objectives, setObjectives] = useState("");
  const [timeline, setTimeline] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasNoHierarchyAssignment, setHasNoHierarchyAssignment] = useState(false);
  const [forEntityType, setForEntityType] = useState<ForEntityType>(null);
  const [forEntityId, setForEntityId] = useState<string | undefined>(undefined);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);

  const user = useUser();

  // Fonction pour charger les informations d'organisation pour un chef de projet
  const loadProjectManagerOrganization = async (email: string) => {
    if (!email) {
      setProjectManagerOrganization({});
      return;
    }
    
    try {
      // Récupérer l'identifiant de l'utilisateur à partir de son email
      const { data: userProfile, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      
      if (userError || !userProfile) {
        console.error("Erreur lors de la récupération du profil utilisateur:", userError);
        setProjectManagerOrganization({});
        return;
      }
      
      // Récupérer l'affectation hiérarchique de l'utilisateur
      const { data: userAssignments, error: assignmentError } = await supabase
        .from("user_hierarchy_assignments")
        .select("entity_id, entity_type")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });
      
      if (assignmentError || !userAssignments || userAssignments.length === 0) {
        // console.log("Aucune affectation hiérarchique trouvée pour l'utilisateur:", email);
        setProjectManagerOrganization({});
        setHasNoHierarchyAssignment(true);
        return;
      }
      
      setHasNoHierarchyAssignment(false);
      
      // Initialiser l'organisation du projet
      const organization: { 
        pole?: { id: string; name: string } | null;
        direction?: { id: string; name: string } | null;
        service?: { id: string; name: string } | null;
      } = {};
      
      // Récupérer les informations des entités assignées
      for (const assignment of userAssignments) {
        if (assignment.entity_type === 'service') {
          const { data: service } = await supabase
            .from("services")
            .select("id, name, direction_id")
            .eq("id", assignment.entity_id)
            .single();
          
          if (service) {
            organization.service = { id: service.id, name: service.name };
            
            // Récupérer la direction parente
            const { data: direction } = await supabase
              .from("directions")
              .select("id, name, pole_id")
              .eq("id", service.direction_id)
              .single();
              
            if (direction) {
              organization.direction = { id: direction.id, name: direction.name };
              
              // Récupérer le pôle parent
              if (direction.pole_id) {
                const { data: pole } = await supabase
                  .from("poles")
                  .select("id, name")
                  .eq("id", direction.pole_id)
                  .single();
                  
                if (pole) {
                  organization.pole = { id: pole.id, name: pole.name };
                }
              }
            }
            
            // Une fois qu'on a trouvé un service, on arrête la recherche
            break;
          }
        } else if (assignment.entity_type === 'direction') {
          const { data: direction } = await supabase
            .from("directions")
            .select("id, name, pole_id")
            .eq("id", assignment.entity_id)
            .single();
            
          if (direction) {
            organization.direction = { id: direction.id, name: direction.name };
            
            // Récupérer le pôle parent
            if (direction.pole_id) {
              const { data: pole } = await supabase
                .from("poles")
                .select("id, name")
                .eq("id", direction.pole_id)
                .single();
                
              if (pole) {
                organization.pole = { id: pole.id, name: pole.name };
              }
            }
            
            // Une fois qu'on a trouvé une direction, on arrête la recherche
            break;
          }
        } else if (assignment.entity_type === 'pole') {
          const { data: pole } = await supabase
            .from("poles")
            .select("id, name")
            .eq("id", assignment.entity_id)
            .single();
            
          if (pole) {
            organization.pole = { id: pole.id, name: pole.name };
            
            // Une fois qu'on a trouvé un pôle, on arrête la recherche
            break;
          }
        }
      }
      
      setProjectManagerOrganization(organization);
    } catch (error) {
      console.error("Erreur lors du chargement de l'organisation du chef de projet:", error);
      setProjectManagerOrganization({});
    }
  };

  useEffect(() => {
    const initializeForm = async () => {
      if (isOpen) {
        setHasUnsavedChanges(false);
        
        setCurrentStep(0);
        setTitle("");
        setDescription("");
        setStartDate(undefined);
        setEndDate(undefined);
        setPriority("medium");
        setMonitoringLevel("none");
        setMonitoringEntityId(null);
        setProjectManagerOrganization({});
        setNovateur(0);
        setUsager(0);
        setOuverture(0);
        setAgilite(0);
        setImpact(0);
        setLifecycleStatus("study");
        
        setContext("");
        setStakeholders("");
        setGovernance("");
        setObjectives("");
        setTimeline("");
        setDeliverables("");
        
        setForEntityType(null);
        setForEntityId(undefined);
        setTemplateId(undefined);

        if (user?.email) {
          setProjectManager(user.email);
          setOwnerId(user.id);
          // Charger l'organisation du chef de projet initial (l'utilisateur connecté)
          await loadProjectManagerOrganization(user.email);
        }

        if (project) {
          setTitle(project.title || "");
          setDescription(project.description || "");
          setProjectManager(project.project_manager || "");
          setStartDate(project.start_date ? new Date(project.start_date) : undefined);
          setEndDate(project.end_date ? new Date(project.end_date) : undefined);
          setPriority(project.priority || "medium");
          setOwnerId(project.owner_id || "");
          setLifecycleStatus(project.lifecycle_status as ProjectLifecycleStatus || "study");
          setForEntityType(project.for_entity_type as ForEntityType || null);
          setForEntityId(project.for_entity_id || undefined);

          // Charger l'organisation du chef de projet existant
          await loadProjectManagerOrganization(project.project_manager);

          try {
            const { data: monitoringData, error } = await supabase
              .from("project_monitoring")
              .select("monitoring_level, monitoring_entity_id")
              .eq("project_id", project.id)
              .maybeSingle();

            if (!error && monitoringData) {
              setMonitoringLevel(monitoringData.monitoring_level);
              setMonitoringEntityId(monitoringData.monitoring_entity_id);
            } else {
              setMonitoringLevel("none");
              setMonitoringEntityId(null);
            }
          } catch (error) {
            console.error("Error in monitoring data fetch:", error);
            setMonitoringLevel("none");
            setMonitoringEntityId(null);
          }

          try {
            const { data: innovationScores, error: innovationError } = await supabase
              .from("project_innovation_scores")
              .select("*")
              .eq("project_id", project.id)
              .maybeSingle();

            if (!innovationError && innovationScores) {
              setNovateur(innovationScores.novateur);
              setUsager(innovationScores.usager);
              setOuverture(innovationScores.ouverture);
              setAgilite(innovationScores.agilite);
              setImpact(innovationScores.impact);
            }
          } catch (error) {
            console.error("Error in innovation scores fetch:", error);
          }

          try {
            const { data: framingData, error: framingError } = await supabase
              .from("project_framing")
              .select("*")
              .eq("project_id", project.id)
              .maybeSingle();

            if (!framingError && framingData) {
              setContext(framingData.context || "");
              setStakeholders(framingData.stakeholders || "");
              setGovernance(framingData.governance || "");
              setObjectives(framingData.objectives || "");
              setTimeline(framingData.timeline || "");
              setDeliverables(framingData.deliverables || "");
            }
          } catch (error) {
            console.error("Error in framing data fetch:", error);
          }
        }
      }
    };

    initializeForm();
  }, [isOpen, project, user?.email, user?.id]);

  // Observer les changements dans le projectManager pour mettre à jour l'organisation
  useEffect(() => {
    if (projectManager) {
      loadProjectManagerOrganization(projectManager);
    }
  }, [projectManager]);

  useEffect(() => {
    if (isOpen && !isSubmitting) {
      setHasUnsavedChanges(true);
    }
  }, [
    title, description, projectManager, startDate, endDate, priority, 
    monitoringLevel, monitoringEntityId, 
    novateur, usager, ouverture, agilite, impact, lifecycleStatus,
    context, stakeholders, governance, objectives, timeline, deliverables,
    forEntityType, forEntityId, templateId
  ]);

  const resetHasUnsavedChanges = () => {
    setHasUnsavedChanges(false);
  };

  const validateStep3 = () => {
    return true;
  };

  return {
    currentStep,
    setCurrentStep,
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
    priority,
    setPriority,
    monitoringLevel,
    setMonitoringLevel,
    monitoringEntityId,
    setMonitoringEntityId,
    ownerId,
    setOwnerId,
    projectManagerOrganization,
    loadProjectManagerOrganization,
    novateur,
    setNovateur,
    usager,
    setUsager,
    ouverture,
    setOuverture,
    agilite,
    setAgilite,
    impact,
    setImpact,
    isSubmitting,
    setIsSubmitting,
    lifecycleStatus,
    setLifecycleStatus,
    validateStep3,
    context,
    setContext,
    stakeholders,
    setStakeholders,
    governance,
    setGovernance,
    objectives,
    setObjectives,
    timeline,
    setTimeline,
    deliverables,
    setDeliverables,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    resetHasUnsavedChanges,
    hasNoHierarchyAssignment,
    forEntityType,
    setForEntityType,
    forEntityId,
    setForEntityId,
    templateId,
    setTemplateId
  };
};
