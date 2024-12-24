import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  };
}

export const ProjectForm = ({ isOpen, onClose, onSubmit, project }: ProjectFormProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(project?.title || "");
  const [description, setDescription] = useState(project?.description || "");
  const [projectManager, setProjectManager] = useState(project?.project_manager || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.start_date ? new Date(project?.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.end_date ? new Date(project?.end_date) : undefined
  );
  const [priority, setPriority] = useState(project?.priority || "medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre du projet est requis",
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

    setIsSubmitting(true);

    try {
      if (project?.id) {
        const { error } = await supabase
          .from("projects")
          .update({
            title,
            description,
            project_manager: projectManager,
            start_date: startDate?.toISOString(),
            end_date: endDate?.toISOString(),
            priority,
          })
          .eq("id", project.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le projet a été mis à jour",
        });
      } else {
        const { error } = await supabase.from("projects").insert({
          title,
          description,
          project_manager: projectManager,
          start_date: startDate?.toISOString(),
          end_date: endDate?.toISOString(),
          priority,
        });

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
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Titre
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom du projet"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du projet"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="project-manager" className="text-sm font-medium">
              Chef de projet
            </label>
            <Input
              id="project-manager"
              value={projectManager}
              onChange={(e) => setProjectManager(e.target.value)}
              placeholder="Nom du chef de projet"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date de début</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`justify-start text-left font-normal ${
                      !startDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`justify-start text-left font-normal ${
                      !endDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="priority" className="text-sm font-medium">
              Priorité
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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