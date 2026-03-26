/**
 * @file PresentationNoteDialog.tsx
 * @description Dialogue modal pour ajouter une note sur le projet
 * directement depuis le mode présentation.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { useProjectNotes } from "@/hooks/useProjectNotes";
import type { ProjectNoteType } from "@/types/project-notes";
import { noteTypeLabels } from "@/types/project-notes";

interface PresentationNoteDialogProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationNoteDialog = ({
  projectId,
  projectTitle,
  isOpen,
  onClose,
}: PresentationNoteDialogProps) => {
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<ProjectNoteType>("meeting");
  const { createNote } = useProjectNotes(projectId);

  /** Soumet la note puis ferme le dialogue */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createNote.mutate(
      {
        project_id: projectId,
        content: content.trim(),
        note_type: noteType,
      },
      {
        onSuccess: () => {
          setContent("");
          setNoteType("meeting");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une note</DialogTitle>
          <DialogDescription className="truncate">
            {projectTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            value={noteType}
            onValueChange={(v) => setNoteType(v as ProjectNoteType)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(noteTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Compte-rendu, décision, remarque..."
            className="min-h-[120px] resize-y"
            autoFocus
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createNote.isPending}
            >
              <Send className="h-4 w-4 mr-1" />
              Publier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
