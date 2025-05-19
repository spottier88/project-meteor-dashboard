
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParentTaskOption {
  value: string;
  label: string;
}

interface TaskFormValues {
  id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  durationDays: number;
  parentTaskId?: string;
}

interface TemplateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskFormValues) => void;
  defaultValues?: TaskFormValues;
  parentTaskOptions: ParentTaskOption[];
  title: string;
}

export const TemplateTaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  parentTaskOptions,
  title,
}: TemplateTaskDialogProps) => {
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [durationDays, setDurationDays] = useState<number>(0);
  const [parentTaskId, setParentTaskId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser le formulaire lorsque le dialogue s'ouvre avec des valeurs par défaut
  useEffect(() => {
    if (open) {
      if (defaultValues) {
        setTaskTitle(defaultValues.title || "");
        setDescription(defaultValues.description || "");
        setStatus(defaultValues.status || 'todo');
        setDurationDays(defaultValues.durationDays || 0);
        setParentTaskId(defaultValues.parentTaskId);
      } else {
        // Réinitialiser les champs quand le dialogue s'ouvre sans valeurs par défaut
        setTaskTitle("");
        setDescription("");
        setStatus('todo');
        setDurationDays(0);
        setParentTaskId(undefined);
      }
    }
  }, [defaultValues, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: defaultValues?.id,
        title: taskTitle.trim(),
        description: description.trim(),
        status,
        durationDays,
        parentTaskId: parentTaskId || undefined
      });
      
      // Ne pas fermer le dialogue ici - laisser le composant parent gérer la fermeture
      // car il doit attendre que la mutation asynchrone soit terminée
    } catch (error) {
      console.error("Erreur lors de la soumission de la tâche:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre de la tâche</Label>
              <Input
                id="title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex: Réunion de lancement"
                autoFocus
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (facultative)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez la tâche..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={status}
                  onValueChange={(value) => setStatus(value as 'todo' | 'in_progress' | 'done')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="done">Terminée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="duration">Durée (jours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {parentTaskOptions.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="parent">Tâche parente (facultatif)</Label>
                <Select 
                  value={parentTaskId || "none"}
                  onValueChange={(value) => setParentTaskId(value === "none" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une tâche parente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune (tâche principale)</SelectItem>
                    {parentTaskOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !taskTitle.trim()}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
