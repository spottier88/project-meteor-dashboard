import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { UserRoleData, UserProfile } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { MonitoringLevel } from "@/types/monitoring";
import { getProjectManagers } from "@/utils/projectManagers";
import { ProjectFormStep1 } from "./form/ProjectFormStep1";
import { ProjectFormStep2 } from "./form/ProjectFormStep2";
import { ProjectFormNavigation } from "./form/ProjectFormNavigation";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: {
    title: string;
    description: string;
    projectManager: string;
    startDate?: Date;
    endDate?: Date;
    priority: string;
    monitoringLevel: MonitoringLevel;
    monitoringEntityId: string | null;
    ownerId: string;
    poleId: string;
    directionId: string;
    serviceId: string;
  }) => void;
  project?: {
    id: string;
    title: string;
    description?: string;
    project_manager?: string;
    start_date?: string;
    end_date?: string;
    priority?: string;
    owner_id?: string;
    pole_id?: string;
    direction_id?: string;
    service_id?: string;
    project_monitoring?: {
      monitoring_level: MonitoringLevel;
      monitoring_entity_id: string | null;
    }[];
  };
}

export const ProjectForm = ({ isOpen, onClose, onSubmit, project }: ProjectFormProps) => {
  const { toast } = useToast();
  const user = useUser();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const { data: projectManagers } = useQuery({
    queryKey: ["projectManagers", user?.id, userRoles],
    queryFn: async () => {
      return getProjectManagers(user?.id, userRoles?.map(ur => ur.role));
    },
    enabled: isOpen && !!user?.id && !!userRoles,
  });

  const isAdmin = userRoles?.some(ur => ur.role === 'admin');
  const isManager = userRoles?.some(ur => ur.role === 'manager');

  useEffect(() => {
    const initializeForm = async () => {
      console.log("Initializing form with project:", project);
      if (isOpen) {
        if (project) {
          console.log("Setting form values for existing project:", project);
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

          try {
            const { data: monitoringData, error } = await supabase
              .from("project_monitoring")
              .select("monitoring_level, monitoring_entity_id")
              .eq("project_id", project.id)
              .maybeSingle();

            if (error) {
              console.error("Error fetching monitoring data:", error);
              return;
            }
            
            if (monitoringData) {
              console.log("Setting monitoring data:", monitoringData);
              setMonitoringLevel(monitoringData.monitoring_level);
              setMonitoringEntityId(monitoringData.monitoring_entity_id);
            } else {
              setMonitoringLevel("none");
              setMonitoringEntityId(null);
            }
          } catch (error) {
            console.error("Error in monitoring data fetch:", error);
          }
        } else {
          console.log("Initializing form for new project");
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
          
          if (user?.email) {
            console.log("Setting default project manager to current user:", user.email);
            setProjectManager(user.email);
            setOwnerId(user.id);
          } else {
            setProjectManager("");
            setOwnerId("");
          }
        }
        setCurrentStep(0);
      }
    };

    initializeForm();
  }, [isOpen, project, user?.email, user?.id]);

  const isStep1Valid = title.trim() !== "" && projectManager.trim() !== "";
  const isStep2Valid = true;

  const handleSubmit = async () => {
    console.log("Handling form submission...");
    console.log("Form data:", {
      title,
      description,
      projectManager,
      startDate,
      endDate,
      priority,
      monitoringLevel,
      monitoringEntityId,
      ownerId,
      poleId,
      directionId,
      serviceId,
    });

    if (!isStep2Valid) {
      console.error("Form validation failed");
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting project data...");
      await onSubmit({
        title,
        description,
        projectManager,
        startDate,
        endDate,
        priority,
        monitoringLevel,
        monitoringEntityId,
        ownerId,
        poleId,
        directionId,
        serviceId,
      });
      console.log("Project submitted successfully");
      toast({
        title: "Succès",
        description: project ? "Projet mis à jour" : "Projet créé",
      });
      onClose();
    } catch (error) {
      console.error("Error submitting project:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    console.log("Moving to next step, current step:", currentStep);
    if (currentStep === 0 && isStep1Valid) {
      setCurrentStep(1);
    } else if (currentStep === 1 && isStep2Valid) {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {project ? "Modifier le projet" : "Nouveau projet"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 0 
              ? "Étape 1: Informations générales du projet" 
              : "Étape 2: Organisation et niveau de suivi"}
          </DialogDescription>
          <Progress value={(currentStep + 1) * 50} className="h-2" />
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {currentStep === 0 ? (
            <ProjectFormStep1
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              projectManager={projectManager}
              setProjectManager={setProjectManager}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              priority={priority}
              setPriority={setPriority}
              isAdmin={isAdmin}
              isManager={isManager}
              projectManagers={projectManagers}
            />
          ) : (
            <ProjectFormStep2
              monitoringLevel={monitoringLevel}
              setMonitoringLevel={setMonitoringLevel}
              monitoringEntityId={monitoringEntityId}
              setMonitoringEntityId={setMonitoringEntityId}
              poleId={poleId}
              setPoleId={setPoleId}
              directionId={directionId}
              setDirectionId={setDirectionId}
              serviceId={serviceId}
              setServiceId={setServiceId}
              project={project}
            />
          )}
        </div>
        
        <DialogFooter>
          <ProjectFormNavigation
            currentStep={currentStep}
            onPrevious={handlePrevious}
            onNext={handleNext}
            canGoNext={currentStep === 0 ? isStep1Valid : isStep2Valid}
            isLastStep={currentStep === 1}
            isSubmitting={isSubmitting}
            onClose={onClose}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};