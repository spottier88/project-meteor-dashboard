import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { UserRoleData, UserProfile } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { ProjectFormFields } from "./form/ProjectFormFields";
import { ProjectFormActions } from "./form/ProjectFormActions";
import { MonitoringLevel } from "@/types/monitoring";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
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
  const user = useUser();
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
    queryKey: ["projectManagers"],
    queryFn: async () => {
      const { data: userRolesData, error: userRolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "chef_projet");

      if (userRolesError) throw userRolesError;

      if (!userRolesData?.length) return [];

      const userIds = userRolesData.map(ur => ur.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds)
        .order("email");

      if (profilesError) throw profilesError;

      return profiles as UserProfile[];
    },
    enabled: isOpen && userRoles?.some(ur => ur.role === "admin"),
  });

  const isAdmin = userRoles?.some(ur => ur.role === 'admin');

  useEffect(() => {
    const initializeForm = async () => {
      if (isOpen) {
        if (project) {
          console.log("Project data:", project);
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

          // Initialisation des données de suivi
          const { data: monitoringData } = await supabase
            .from("project_monitoring")
            .select("monitoring_level, monitoring_entity_id")
            .eq("project_id", project.id)
            .maybeSingle();

          console.log("Monitoring data from DB:", monitoringData);
          
          if (monitoringData) {
            setMonitoringLevel(monitoringData.monitoring_level);
            setMonitoringEntityId(monitoringData.monitoring_entity_id);
          } else {
            setMonitoringLevel("none");
            setMonitoringEntityId(null);
          }
        } else {
          // Réinitialisation pour un nouveau projet
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
          
          if (!isAdmin && user?.id) {
            setOwnerId(user.id);
            setProjectManager(user.email || "");
          } else {
            setOwnerId("");
            setProjectManager("");
          }
        }
      }
    };

    initializeForm();
  }, [isOpen, project, user?.email, user?.id, isAdmin]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {project ? "Modifier le projet" : "Nouveau projet"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations du projet. Les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <ProjectFormFields
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
            monitoringLevel={monitoringLevel}
            setMonitoringLevel={setMonitoringLevel}
            monitoringEntityId={monitoringEntityId}
            setMonitoringEntityId={setMonitoringEntityId}
            isAdmin={isAdmin}
            ownerId={ownerId}
            setOwnerId={setOwnerId}
            poleId={poleId}
            setPoleId={setPoleId}
            directionId={directionId}
            setDirectionId={setDirectionId}
            serviceId={serviceId}
            setServiceId={setServiceId}
            project={project}
            projectManagers={projectManagers}
          />
        </div>
        
        <DialogFooter>
          <ProjectFormActions
            isSubmitting={isSubmitting}
            onClose={onClose}
            onSubmit={onSubmit}
            project={project}
            formData={{
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
            }}
            user={user}
            isAdmin={isAdmin}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};