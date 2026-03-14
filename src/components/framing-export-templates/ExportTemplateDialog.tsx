/**
 * @component ExportTemplateDialog
 * @description Dialogue de création/édition d'un modèle d'export de note de cadrage.
 * Permet de saisir le titre, la description et d'uploader le fichier DOCX.
 * Intègre un lint automatique du template à l'upload.
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
import { Upload, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useCreateFramingExportTemplate,
  useUpdateFramingExportTemplate,
  FramingExportTemplate,
} from "@/hooks/useFramingExportTemplates";
import { lintTemplate, LintReport } from "@/utils/templateLinter";

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
  const [lintReport, setLintReport] = useState<LintReport | null>(null);
  const [isLinting, setIsLinting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateFramingExportTemplate();
  const updateMutation = useUpdateFramingExportTemplate();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  /** Gestion de la sélection d'un fichier avec lint automatique */
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setLintReport(null);
    setIsLinting(true);

    try {
      const report = await lintTemplate(selectedFile);
      setLintReport(report);
    } catch (err) {
      console.error("[ExportTemplateDialog] Erreur lint:", err);
      setLintReport(null);
    } finally {
      setIsLinting(false);
    }
  };

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

    setTitle("");
    setDescription("");
    setFile(null);
    setLintReport(null);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (open && template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setFile(null);
      setLintReport(null);
    } else if (!open) {
      setTitle("");
      setDescription("");
      setFile(null);
      setLintReport(null);
    }
    onOpenChange(open);
  };

  /** Rendu du rapport de lint */
  const renderLintReport = () => {
    if (isLinting) {
      return (
        <Alert>
          <AlertDescription className="text-sm">
            Analyse du modèle en cours...
          </AlertDescription>
        </Alert>
      );
    }

    if (!lintReport) return null;

    const errors = lintReport.warnings.filter((w) => w.severity === "error");
    const warnings = lintReport.warnings.filter((w) => w.severity === "warning");

    return (
      <div className="space-y-2">
        {/* Résumé */}
        <Alert variant={errors.length > 0 ? "destructive" : "default"}>
          <div className="flex items-center gap-2">
            {errors.length > 0 ? (
              <XCircle className="h-4 w-4" />
            ) : warnings.length > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className="text-sm">
              {lintReport.totalPlaceholders} balise(s) détectée(s)
              {errors.length > 0 && ` • ${errors.length} erreur(s)`}
              {warnings.length > 0 && ` • ${warnings.length} avertissement(s)`}
              {errors.length === 0 && warnings.length === 0 && " • Modèle compatible ✓"}
            </AlertDescription>
          </div>
        </Alert>

        {/* Détails des erreurs */}
        {errors.map((w, i) => (
          <div key={`err-${i}`} className="text-xs text-destructive bg-destructive/10 rounded p-2">
            <strong>Erreur :</strong> {w.message}
            {w.tags && <span className="ml-1 opacity-70">({w.tags.join(", ")})</span>}
          </div>
        ))}

        {/* Détails des avertissements */}
        {warnings.map((w, i) => (
          <div key={`warn-${i}`} className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded p-2">
            <strong>Attention :</strong> {w.message}
            {w.tags && <span className="ml-1 opacity-70">({w.tags.join(", ")})</span>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                if (f) handleFileSelect(f);
              }}
            />
          </div>

          {/* Rapport de lint du template */}
          {renderLintReport()}
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
