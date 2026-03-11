/**
 * @component ExportTemplateDialog
 * @description Dialogue de création/édition d'un modèle d'export de note de cadrage.
 * Permet de saisir le titre, la description et d'uploader le fichier DOCX.
 */

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import {
  useCreateFramingExportTemplate,
  useUpdateFramingExportTemplate,
  FramingExportTemplate,
} from "@/hooks/useFramingExportTemplates";

interface ExportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: FramingExportTemplate | null;
}

export const ExportTemplateDialog = ({
  open,
  onOpenChange,
  template,
}: ExportTemplateDialogProps) => {
  const isEdit = !!template;
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateFramingExportTemplate();
  const updateMutation = useUpdateFramingExportTemplate();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if (!isEdit && !file) return;

    if (isEdit && template) {
      await updateMutation.mutateAsync({
        id: template.id,
        title,
        description,
        file: file || undefined,
        oldFilePath: file ? template.file_path : undefined,
      });
    } else if (file) {
      await createMutation.mutateAsync({ title, description, file });
    }

    // Réinitialiser et fermer
    setTitle("");
    setDescription("");
    setFile(null);
    onOpenChange(false);
  };

  // Réinitialiser les champs à l'ouverture
  const handleOpenChange = (open: boolean) => {
    if (open && template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setFile(null);
    } else if (!open) {
      setTitle("");
      setDescription("");
      setFile(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le modèle" : "Ajouter un modèle d'export"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations du modèle ou remplacez le fichier DOCX."
              : "Chargez un fichier DOCX contenant les balises de publipostage."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Modèle charte graphique 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle du modèle"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fichier DOCX {!isEdit && "*"}</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : isEdit ? (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fichier actuel : <span className="font-medium">{template?.file_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliquez pour remplacer le fichier
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cliquez pour sélectionner un fichier DOCX
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || (!isEdit && !file)}
          >
            {isLoading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
