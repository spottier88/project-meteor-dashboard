
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLifecycleStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { MonitoringLevel } from "@/types/monitoring";

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
  priority: "high" | "medium" | "low";
  setPriority: (priority: "high" | "medium" | "low") => void;
  monitoringLevel: MonitoringLevel;
  setMonitoringLevel: (level: MonitoringLevel) => void;
  directionId: string;
  setDirectionId: (id: string) => void;
  poleId: string;
  setPoleId: (id: string) => void;
  serviceId: string;
  setServiceId: (id: string) => void;
  confidentiality: "public" | "internal" | "confidential" | "restricted";
  setConfidentiality: (level: "public" | "internal" | "confidential" | "restricted") => void;
  budgetImpact: "none" | "low" | "medium" | "high";
  setBudgetImpact: (impact: "none" | "low" | "medium" | "high") => void;
  reputationImpact: "none" | "low" | "medium" | "high";
  setReputationImpact: (impact: "none" | "low" | "medium" | "high") => void;
  regulatoryImpact: "none" | "low" | "medium" | "high";
  setRegulatoryImpact: (impact: "none" | "low" | "medium" | "high") => void;
  innovationLevel: "incremental" | "breakthrough" | "disruptive" | "none";
  setInnovationLevel: (level: "incremental" | "breakthrough" | "disruptive" | "none") => void;
  innovationTypes: string[];
  setInnovationTypes: (types: string[]) => void;
  innovationObjectives: string[];
  setInnovationObjectives: (objectives: string[]) => void;
  innovationScopes: string[];
  setInnovationScopes: (scopes: string[]) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
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
  lifecycleStatus: ProjectLifecycleStatus;
  setLifecycleStatus: (status: ProjectLifecycleStatus) => void;
  // Ajout des nouveaux états pour les scores d'innovation
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
}

export const useProjectFormState = (isOpen: boolean, project?: any): ProjectFormState => {
  const user = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [monitoringLevel, setMonitoringLevel] = useState<MonitoringLevel>("standard");
  const [directionId, setDirectionId] = useState("");
  const [poleId, setPoleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [confidentiality, setConfidentiality] = useState<"public" | "internal" | "confidential" | "restricted">("internal");
  const [budgetImpact, setBudgetImpact] = useState<"none" | "low" | "medium" | "high">("low");
  const [reputationImpact, setReputationImpact] = useState<"none" | "low" | "medium" | "high">("low");
  const [regulatoryImpact, setRegulatoryImpact] = useState<"none" | "low" | "medium" | "high">("low");
  const [innovationLevel, setInnovationLevel] = useState<"incremental" | "breakthrough" | "disruptive" | "none">("incremental");
  const [innovationTypes, setInnovationTypes] = useState<string[]>([]);
  const [innovationObjectives, setInnovationObjectives] = useState<string[]>([]);
  const [innovationScopes, setInnovationScopes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [context, setContext] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [governance, setGovernance] = useState("");
  const [objectives, setObjectives] = useState("");
  const [timeline, setTimeline] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [lifecycleStatus, setLifecycleStatus] = useState<ProjectLifecycleStatus>("in_progress");
  // Nouveaux états pour les scores d'innovation
  const [novateur, setNovateur] = useState(0);
  const [usager, setUsager] = useState(0);
  const [ouverture, setOuverture] = useState(0);
  const [agilite, setAgilite] = useState(0);
  const [impact, setImpact] = useState(0);

  // Reset state when form opens or project changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      
      // Si nous avons un utilisateur connecté et que c'est un nouveau projet,
      // définir l'utilisateur comme chef de projet par défaut
      if (user && !project) {
        const fetchUserEmail = async () => {
          try {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', user.id)
              .single();
            
            if (userProfile?.email) {
              setProjectManager(userProfile.email);
            }
          } catch (error) {
            console.error("Erreur lors de la récupération de l'email de l'utilisateur:", error);
          }
        };

        fetchUserEmail();
      }
      
      if (project) {
        setTitle(project.title || "");
        setDescription(project.description || "");
        setProjectManager(project.project_manager || "");
        setStartDate(project.start_date ? new Date(project.start_date) : undefined);
        setEndDate(project.end_date ? new Date(project.end_date) : undefined);
        setPriority(project.priority || "medium");
        setMonitoringLevel(project.monitoring_level || "standard");
        setDirectionId(project.direction_id || "");
        setPoleId(project.pole_id || "");
        setServiceId(project.service_id || "");
        setConfidentiality(project.confidentiality || "internal");
        setBudgetImpact(project.budget_impact || "low");
        setReputationImpact(project.reputation_impact || "low");
        setRegulatoryImpact(project.regulatory_impact || "low");
        setInnovationLevel(project.innovation_level || "incremental");
        setInnovationTypes(project.innovation_types || []);
        setInnovationObjectives(project.innovation_objectives || []);
        setInnovationScopes(project.innovation_scopes || []);
        setLifecycleStatus(project.lifecycle_status || "in_progress");

        // Récupérer les scores d'innovation
        const fetchInnovationScores = async () => {
          if (project.id) {
            const { data, error } = await supabase
              .from('project_innovation_scores')
              .select('*')
              .eq('project_id', project.id)
              .maybeSingle();
              
            if (!error && data) {
              setNovateur(data.novateur || 0);
              setUsager(data.usager || 0);
              setOuverture(data.ouverture || 0);
              setAgilite(data.agilite || 0);
              setImpact(data.impact || 0);
            }
          }
        };
        
        // Fetch project framing data if exists
        const fetchFramingData = async () => {
          if (project.id) {
            const { data, error } = await supabase
              .from('project_framing')
              .select('*')
              .eq('project_id', project.id)
              .maybeSingle();
              
            if (!error && data) {
              setContext(data.context || "");
              setStakeholders(data.stakeholders || "");
              setGovernance(data.governance || "");
              setObjectives(data.objectives || "");
              setTimeline(data.timeline || "");
              setDeliverables(data.deliverables || "");
            }
          }
        };
        
        fetchFramingData();
        fetchInnovationScores();
      } else {
        // Reset to default values for new project
        setTitle("");
        setDescription("");
        // projectManager est défini ailleurs pour les nouveaux projets
        setStartDate(undefined);
        setEndDate(undefined);
        setPriority("medium");
        setMonitoringLevel("standard");
        setDirectionId("");
        setPoleId("");
        setServiceId("");
        setConfidentiality("internal");
        setBudgetImpact("low");
        setReputationImpact("low");
        setRegulatoryImpact("low");
        setInnovationLevel("incremental");
        setInnovationTypes([]);
        setInnovationObjectives([]);
        setInnovationScopes([]);
        setContext("");
        setStakeholders("");
        setGovernance("");
        setObjectives("");
        setTimeline("");
        setDeliverables("");
        setLifecycleStatus("in_progress");
        setNovateur(0);
        setUsager(0);
        setOuverture(0);
        setAgilite(0);
        setImpact(0);
      }
    }
  }, [isOpen, project, user]);

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
    directionId,
    setDirectionId,
    poleId,
    setPoleId,
    serviceId,
    setServiceId,
    confidentiality,
    setConfidentiality,
    budgetImpact,
    setBudgetImpact,
    reputationImpact,
    setReputationImpact,
    regulatoryImpact,
    setRegulatoryImpact,
    innovationLevel,
    setInnovationLevel,
    innovationTypes,
    setInnovationTypes,
    innovationObjectives,
    setInnovationObjectives,
    innovationScopes,
    setInnovationScopes,
    isSubmitting,
    setIsSubmitting,
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
    lifecycleStatus,
    setLifecycleStatus,
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
  };
};
