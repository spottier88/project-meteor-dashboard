
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

interface TemplateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    id?: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    durationDays: number;
    parentTaskId?: string;
  }) => void;
  defaultValues?: {
    id?: string;
    title: string;
    description?: string;
    status: string;
    duration_days?: number;
    parent_task_id?: string;
  };
  parentTaskOptions: { value: string; label: string }[];
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
  const [taskTitle, setTaskTitle] = useState(defaultValues?.title || "");
  const [taskDescription, setTaskDescription] = useState(defaultValues?.description || "");
  const [taskStatus, setTaskStatus] = useState<'todo' | 'in_progress' | 'done'>(
    (defaultValues?.status as 'todo' | 'in_progress' | 'done') || 'todo'
  );
  const [durationDays, setDurationDays] = useState(defaultValues?.duration_days || 0);
  const [parentTaskId, setParentTaskId] = useState(defaultValues?.parent_task_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser le formulaire lors de l'ouverture du dialogue avec de nouvelles valeurs
  useEffect(() => {
    if (open) {
      setTaskTitle(defaultValues?.title || "");
      setTaskDescription(defaultValues?.description || "");
      setTaskStatus((defaultValues?.status as 'todo' | 'in_progress' | 'done') || 'todo');
      setDurationDays(defaultValues?.duration_days || 0);
      setParentTaskId(defaultValues?.parent_task_id || "");
    }
  }, [open, defaultValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...(defaultValues?.id && { id: defaultValues.id }),
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        status: taskStatus,
        durationDays,
        ...(parentTaskId && { parentTaskId }),
      });
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
                placeholder="Ex: Analyse des besoins"
                autoFocus
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (facultative)</Label>
              <Textarea
                id="description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Décrivez cette tâche..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={taskStatus} onValueChange={(value: 'todo' | 'in_progress' | 'done') => setTaskStatus(value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="done">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Durée estimée (jours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            {parentTaskOptions.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="parent-task">Tâche parente (facultatif)</Label>
                <Select value={parentTaskId} onValueChange={setParentTaskId}>
                  <SelectTrigger id="parent-task">
                    <SelectValue placeholder="Sélectionner une tâche parente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune (tâche principale)</SelectItem>
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
