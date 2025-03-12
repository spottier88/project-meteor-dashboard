import { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { MonitoringLevel } from "@/types/monitoring";
import { ProjectLifecycleStatus } from "@/types/project";

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
  poleId: string;
  setPoleId: (id: string) => void;
  directionId: string;
  setDirectionId: (id: string) => void;
  serviceId: string;
  setServiceId: (id: string) => void;
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
  const [poleId, setPoleId] = useState("none");
  const [directionId, setDirectionId] = useState("none");
  const [serviceId, setServiceId] = useState("none");
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

  const user = useUser();

  useEffect(() => {
    const initializeForm = async () => {
      if (isOpen) {
        if (project) {
          setTitle(project.title || "");
          setDescription(project.description || "");
          setProjectManager(project.project_manager || "");
          setStartDate(project.start_date ? new Date(project.start_date) : undefined);
          setEndDate(project.end_date ? new Date(project.end_date) : undefined);
          setPriority(project.priority || "medium");
          setPoleId(project.pole_id || "none");
          setDirectionId(project.direction_id || "none");
          setServiceId(project.service_id || "none");
          setOwnerId(project.owner_id || "");
          setLifecycleStatus(project.lifecycle_status as ProjectLifecycleStatus || "study");

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
          }

          const { data: innovationScores } = await supabase
            .from("project_innovation_scores")
            .select("*")
            .eq("project_id", project.id)
            .maybeSingle();

          if (innovationScores) {
            setNovateur(innovationScores.novateur);
            setUsager(innovationScores.usager);
            setOuverture(innovationScores.ouverture);
            setAgilite(innovationScores.agilite);
            setImpact(innovationScores.impact);
          }

          const { data: framingData } = await supabase
            .from("project_framing")
            .select("*")
            .eq("project_id", project.id)
            .maybeSingle();

          if (framingData) {
            setContext(framingData.context || "");
            setStakeholders(framingData.stakeholders || "");
            setGovernance(framingData.governance || "");
            setObjectives(framingData.objectives || "");
            setTimeline(framingData.timeline || "");
            setDeliverables(framingData.deliverables || "");
          }
        } else {
          setTitle("");
          setDescription("");
          setStartDate(undefined);
          setEndDate(undefined);
          setPriority("medium");
          setMonitoringLevel("none");
          setMonitoringEntityId(null);
          setPoleId("none");
          setDirectionId("none");
          setServiceId("none");
          setNovateur(0);
          setUsager(0);
          setOuverture(0);
          setAgilite(0);
          setImpact(0);
          setLifecycleStatus("study");
          
          if (user?.email) {
            setProjectManager(user.email);
            setOwnerId(user.id);
          }

          setContext("");
          setStakeholders("");
          setGovernance("");
          setObjectives("");
          setTimeline("");
          setDeliverables("");
        }
        setCurrentStep(0);
      }
    };

    initializeForm();
  }, [isOpen, project, user?.email, user?.id]);

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
    poleId,
    setPoleId,
    directionId,
    setDirectionId,
    serviceId,
    setServiceId,
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
  };
};
