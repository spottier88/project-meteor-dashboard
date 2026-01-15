/**
 * @component ProjectNoteForm
 * @description Formulaire pour créer ou modifier une note de projet.
 * Permet de saisir le contenu et de sélectionner le type de note.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Send, X } from "lucide-react";
import type { ProjectNoteType, CreateProjectNoteInput, ProjectNote } from "@/types/project-notes";
import { noteTypeLabels } from "@/types/project-notes";

interface ProjectNoteFormProps {
  projectId: string;
  onSubmit: (input: CreateProjectNoteInput) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  editingNote?: ProjectNote | null;
  onUpdate?: (noteId: string, content: string, noteType: ProjectNoteType) => void;
}

export const ProjectNoteForm = ({
  projectId,
  onSubmit,
  onCancel,
  isLoading = false,
  editingNote,
  onUpdate,
}: ProjectNoteFormProps) => {
  const [content, setContent] = useState(editingNote?.content || "");
  const [noteType, setNoteType] = useState<ProjectNoteType>(editingNote?.note_type || "memo");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    if (editingNote && onUpdate) {
      onUpdate(editingNote.id, content, noteType);
    } else {
      onSubmit({
        project_id: projectId,
        content: content.trim(),
        note_type: noteType,
      });
    }

    // Réinitialiser le formulaire si ce n'est pas une édition
    if (!editingNote) {
      setContent("");
      setNoteType("memo");
    }
  };

  const isEditing = !!editingNote;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <Select
              value={noteType}
              onValueChange={(value) => setNoteType(value as ProjectNoteType)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(noteTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {isEditing ? "Modifier la note" : "Nouvelle note"}
            </span>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre note ici... (compte-rendu de réunion, mémo, décision...)"
            className="min-h-[100px] resize-y"
          />

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isLoading}
            >
              <Send className="h-4 w-4 mr-1" />
              {isEditing ? "Modifier" : "Publier"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
