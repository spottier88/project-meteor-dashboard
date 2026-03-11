/**
 * @component FramingExportDialog
 * @description Dialogue permettant de choisir le format d'export (PDF ou DOCX)
 * pour la note de cadrage du projet. Si DOCX est sélectionné et des modèles
 * sont disponibles, permet de choisir un modèle de publipostage.
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, File } from "lucide-react";
import { useFramingExportTemplates } from "@/hooks/useFramingExportTemplates";

interface FramingExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'pdf' | 'docx', templateId?: string) => Promise<void>;
  isExporting: boolean;
}

export const FramingExportDialog = ({
  open,
  onOpenChange,
  onExport,
  isExporting,
}: FramingExportDialogProps) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx'>('pdf');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");

  // Charger les modèles actifs
  const { data: templates = [] } = useFramingExportTemplates(true);

  // Sélectionner le modèle par défaut à l'ouverture
  useEffect(() => {
    if (open && templates.length > 0) {
      const defaultTemplate = templates.find((t) => t.is_default);
      setSelectedTemplateId(defaultTemplate?.id || "none");
    }
  }, [open, templates]);

  const handleExport = async () => {
    const templateId = selectedFormat === 'docx' && selectedTemplateId !== "none"
      ? selectedTemplateId
      : undefined;
    await onExport(selectedFormat, templateId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exporter la note de cadrage</DialogTitle>
          <DialogDescription>
            Choisissez le format d'export pour la note de cadrage du projet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <RadioGroup
            value={selectedFormat}
            onValueChange={(value) => setSelectedFormat(value as 'pdf' | 'docx')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 rounded-lg border border-input p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label
                htmlFor="pdf"
                className="flex items-center flex-1 cursor-pointer"
              >
                <FileText className="h-5 w-5 mr-3 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Format PDF</span>
                  <span className="text-sm text-muted-foreground">
                    Document portable, lecture universelle
                  </span>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border border-input p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer">
              <RadioGroupItem value="docx" id="docx" />
              <Label
                htmlFor="docx"
                className="flex items-center flex-1 cursor-pointer"
              >
                <File className="h-5 w-5 mr-3 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Format DOCX</span>
                  <span className="text-sm text-muted-foreground">
                    Document Word, éditable et modifiable
                  </span>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Sélecteur de modèle si DOCX et des modèles existent */}
          {selectedFormat === 'docx' && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Modèle de document</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sans modèle (export standard)</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                      {t.is_default ? " ★" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Le modèle sera utilisé comme base et les balises seront remplacées par les données du projet.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Génération..." : "Exporter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
