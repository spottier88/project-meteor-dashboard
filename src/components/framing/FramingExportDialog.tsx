/**
 * @component FramingExportDialog
 * @description Dialogue permettant de choisir le format d'export (PDF ou DOCX)
 * pour la note de cadrage du projet.
 */

import { useState } from "react";
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
import { FileText, File } from "lucide-react";

interface FramingExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'pdf' | 'docx') => Promise<void>;
  isExporting: boolean;
}

export const FramingExportDialog = ({
  open,
  onOpenChange,
  onExport,
  isExporting,
}: FramingExportDialogProps) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx'>('pdf');

  const handleExport = async () => {
    await onExport(selectedFormat);
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
        
        <div className="py-4">
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
