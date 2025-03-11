
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Save, Trash, X } from "lucide-react";
import { SECTION_LABELS, SectionType } from "@/types/framework-note";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FrameworkNoteSectionProps {
  section: {
    id: string;
    section_type: SectionType;
    content: string;
  };
  onUpdate: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const FrameworkNoteSection = ({ section, onUpdate, onDelete }: FrameworkNoteSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(section.content);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    try {
      await onUpdate(content);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setContent(section.content);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {SECTION_LABELS[section.section_type]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm">
            {section.content}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              Enregistrer
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Cela supprimera définitivement 
                    cette section de la note de cadrage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
