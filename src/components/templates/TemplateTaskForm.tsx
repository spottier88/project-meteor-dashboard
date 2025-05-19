
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ProjectTemplateTask } from "@/hooks/useProjectTemplates";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface TemplateTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<ProjectTemplateTask>) => void;
  task?: ProjectTemplateTask;
  templateId: string;
  parentTasks?: ProjectTemplateTask[];
}

export const TemplateTaskForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  task, 
  templateId,
  parentTasks = [] 
}: TemplateTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectTemplateTask['status']>("todo");
  const [durationDays, setDurationDays] = useState<string>("");
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setDurationDays(task.duration_days?.toString() || "");
      setParentTaskId(task.parent_task_id);
    } else {
      // Réinitialiser le formulaire
      setTitle("");
      setDescription("");
      setStatus("todo");
      setDurationDays("");
      setParentTaskId(null);
    }
    setErrors({});
  }, [task, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = "Le titre est requis";
    }
    
    if (durationDays && isNaN(Number(durationDays))) {
      newErrors.durationDays = "La durée doit être un nombre";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    onSubmit({
      ...(task ? { id: task.id } : {}),
      template_id: templateId,
      title: title.trim(),
      description: description.trim() || null,
      status,
      duration_days: durationDays ? parseInt(durationDays) : null,
      parent_task_id: parentTaskId
    });
  };

  // Exclure la tâche actuelle et ses enfants des options de parents potentiels
  // pour éviter des cycles dans la hiérarchie
  const eligibleParentTasks = parentTasks.filter(
    parentTask => !task || parentTask.id !== task.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {task ? "Modifier la tâche" : "Ajouter une tâche"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-right">
              Titre
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la tâche (optionnelle)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">
                Statut initial
              </Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProjectTemplateTask['status'])}>
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
            
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-right">
                Durée estimée (jours)
              </Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="Durée en jours"
                className={errors.durationDays ? "border-red-500" : ""}
              />
              {errors.durationDays && (
                <p className="text-sm text-red-500">{errors.durationDays}</p>
              )}
            </div>
          </div>
          
          {eligibleParentTasks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parentTask" className="text-right">
                Tâche parent (optionnelle)
              </Label>
              <Select 
                value={parentTaskId || ""} 
                onValueChange={(value) => setParentTaskId(value || null)}
              >
                <SelectTrigger id="parentTask">
                  <SelectValue placeholder="Aucune tâche parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {eligibleParentTasks.map((parentTask) => (
                    <SelectItem key={parentTask.id} value={parentTask.id}>
                      {parentTask.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {task ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
