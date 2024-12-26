import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProjectFormFields } from "./form/ProjectFormFields";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { UserRoleData } from "@/types/user";

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
  };
}

export const ProjectForm = ({ isOpen, onClose, onSubmit, project }: ProjectFormProps) => {
  const { toast } = useToast();
  const user = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState("medium");
  const [suiviDgs, setSuiviDgs] = useState(false);
  const [ownerId, setOwnerId] = useState("");
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
      setTitle(project?.title || "");
      setDescription(project?.description || "");
      setOwnerId(project?.owner_id || "");
      // Si c'est un nouveau projet et que l'utilisateur n'est pas admin,
      // on force le chef de projet à être l'utilisateur connecté
      if (!project && !isAdmin && user?.email) {
        setProjectManager(user.email);
        setOwnerId(user.id);
      } else {
        setProjectManager(project?.project_manager || "");
      }
      setStartDate(project?.start_date ? new Date(project.start_date) : undefined);
      setEndDate(project?.end_date ? new Date(project.end_date) : undefined);
      setPriority(project?.priority || "medium");
      setSuiviDgs(project?.suivi_dgs || false);
    }
  }, [isOpen, project, user?.email, user?.id, isAdmin]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre du projet est requis",
        variant: "destructive",
      });
      return;
    }

    if (!projectManager.trim()) {
      toast({
        title: "Erreur",
        description: "Le chef de projet est requis",
        variant: "destructive",
      });
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être postérieure à la date de début",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer ou modifier un projet",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        title,
        description,
        project_manager: projectManager,
        start_date: startDate?.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0],
        priority,
        suivi_dgs: suiviDgs,
        owner_id: ownerId,
      };

      if (project?.id) {
        // Check if user has permission to update
        const canUpdate = isAdmin || project.owner_id === user.id;

        if (!canUpdate) {
          toast({
            title: "Erreur",
            description: "Vous n'avez pas les droits pour modifier ce projet",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", project.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le projet a été mis à jour",
        });
      } else {
        const { error } = await supabase.from("projects").insert(projectData);

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Erreur",
              description: "Un projet avec ce titre existe déjà",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Succès",
          description: "Le projet a été créé",
        });
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {project ? "Modifier le projet" : "Nouveau projet"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations du projet. Les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
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
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              "Enregistrement..."
            ) : project ? (
              "Mettre à jour"
            ) : (
              "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};