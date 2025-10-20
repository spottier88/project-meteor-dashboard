/**
 * @file LinkProjectDialog.tsx
 * @description Dialog pour lier un projet à un projet existant (admin uniquement)
 * Permet de sélectionner un projet maître parmi les projets disponibles
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useProjectLinks } from "@/hooks/useProjectLinks";
import { useProjectsListView } from "@/hooks/use-projects-list-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LinkProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  currentProjectTitle: string;
}

export const LinkProjectDialog = ({
  isOpen,
  onClose,
  currentProjectId,
  currentProjectTitle,
}: LinkProjectDialogProps) => {
  const [selectedMasterProjectId, setSelectedMasterProjectId] = useState<string>("");
  const { data: projects } = useProjectsListView();
  const { linkProjects } = useProjectLinks(currentProjectId);

  // Filtrer les projets : exclure le projet actuel et les projets déjà liés
  const availableProjects = projects?.filter(
    (p: any) => p.id !== currentProjectId
  ) || [];

  const handleLink = () => {
    if (selectedMasterProjectId) {
      linkProjects.mutate({
        masterProjectId: selectedMasterProjectId,
        linkedProjectId: currentProjectId,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Lier ce projet à un projet existant</DialogTitle>
          <DialogDescription>
            Le projet "{currentProjectTitle}" sera lié au projet sélectionné.
            Toutes les données seront agrégées sur le projet maître.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Sélectionner le projet maître</Label>
            <Select
              value={selectedMasterProjectId}
              onValueChange={setSelectedMasterProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un projet..." />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            Annuler
          </Button>
          <Button 
            onClick={(e) => { e.stopPropagation(); handleLink(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            disabled={!selectedMasterProjectId || linkProjects.isLoading}
          >
            Lier les projets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
