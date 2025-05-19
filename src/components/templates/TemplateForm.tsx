
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProjectTemplate } from "@/hooks/useProjectTemplates";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateData: Partial<ProjectTemplate>) => void;
  template?: ProjectTemplate;
}

export const TemplateForm = ({ isOpen, onClose, onSubmit, template }: TemplateFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setIsActive(template.is_active);
    } else {
      // Réinitialiser le formulaire
      setTitle("");
      setDescription("");
      setIsActive(true);
    }
    setErrors({});
  }, [template, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = "Le titre est requis";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    onSubmit({
      ...(template ? { id: template.id } : {}),
      title: title.trim(),
      description: description.trim() || null,
      is_active: isActive
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {template ? "Modifier le modèle" : "Créer un nouveau modèle"}
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
              placeholder="Titre du modèle"
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
              placeholder="Description du modèle (optionnelle)"
              rows={3}
            />
          </div>
          
          {template && (
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isActive} 
                onCheckedChange={setIsActive} 
                id="is-active"
              />
              <Label htmlFor="is-active">Actif</Label>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {template ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
