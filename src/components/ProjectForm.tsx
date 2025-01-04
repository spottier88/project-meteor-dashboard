import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { UserRoleData } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { ProjectFormFields } from "./form/ProjectFormFields";
import { ProjectFormActions } from "./form/ProjectFormActions";

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
    suivi_dgs?: boolean;
    owner_id?: string;
    pole_id?: string;
    direction_id?: string;
    service_id?: string;
    poles?: {
      id: string;
      name: string;
    };
    directions?: {
      id: string;
      name: string;
    };
    services?: {
      id: string;
      name: string;
    };
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
  const [suiviDgs, setSuiviDgs] = useState(false);
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

  const isAdmin = userRoles?.some(ur => ur.role === 'admin');

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setTitle(project.title || "");
        setDescription(project.description || "");
        setProjectManager(project.project_manager || "");
        setStartDate(project.start_date ? new Date(project.start_date) : undefined);
        setEndDate(project.end_date ? new Date(project.end_date) : undefined);
        setPriority(project.priority || "medium");
        setSuiviDgs(project.suivi_dgs || false);
        setPoleId(project.pole_id || "none");
        setDirectionId(project.direction_id || "none");
        setServiceId(project.service_id || "none");
        setOwnerId(project.owner_id || "");
      } else {
        if (!isAdmin && user?.id) {
          setOwnerId(user.id);
          setProjectManager(user.email || "");
        } else {
          setOwnerId("");
        }
      }
    }
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
            suiviDgs={suiviDgs}
            setSuiviDgs={setSuiviDgs}
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
              suiviDgs,
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