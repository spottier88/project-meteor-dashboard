/**
 * @component ProjectNoteCard
 * @description Affiche une note de projet avec ses informations et actions.
 * Affiche l'auteur, la date, le type et le contenu de la note.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Pin, PinOff, Edit, Trash2 } from "lucide-react";
import type { ProjectNote, ProjectNoteType } from "@/types/project-notes";
import { noteTypeLabels, noteTypeColors } from "@/types/project-notes";

/**
 * Formate le nom d'affichage d'un auteur à partir des données du profil
 */
const formatAuthorName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined
): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }
  return email || "Utilisateur inconnu";
};

interface ProjectNoteCardProps {
  note: ProjectNote;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (note: ProjectNote) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string, isPinned: boolean) => void;
}

export const ProjectNoteCard = ({
  note,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onTogglePin,
}: ProjectNoteCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Formatage de la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Nom de l'auteur
  const authorName = note.author 
    ? formatAuthorName(note.author.first_name, note.author.last_name, note.author.email)
    : "Utilisateur inconnu";

  const hasActions = canEdit || canDelete;

  return (
    <>
      <Card className={`transition-all ${note.is_pinned ? "border-primary bg-primary/5" : ""}`}>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {note.is_pinned && (
                <Pin className="h-4 w-4 text-primary fill-current" />
              )}
              <Badge 
                variant="secondary" 
                className={noteTypeColors[note.note_type as ProjectNoteType]}
              >
                {noteTypeLabels[note.note_type as ProjectNoteType] || note.note_type}
              </Badge>
              <span className="text-sm font-medium">{authorName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(note.created_at)}
              </span>
              {note.updated_at !== note.created_at && (
                <span className="text-xs text-muted-foreground italic">
                  (modifié)
                </span>
              )}
            </div>

            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <>
                      <DropdownMenuItem onClick={() => onTogglePin(note.id, note.is_pinned)}>
                        {note.is_pinned ? (
                          <>
                            <PinOff className="h-4 w-4 mr-2" />
                            Désépingler
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4 mr-2" />
                            Épingler
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(note)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
        </CardContent>
      </Card>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(note.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
