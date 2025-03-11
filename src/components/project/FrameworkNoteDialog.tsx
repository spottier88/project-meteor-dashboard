
import React from 'react';
import { Dialog, DialogContent, DialogHeader, 
         DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { formatDate } from 'date-fns';

interface FrameworkNoteDialogProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
}

export const FrameworkNoteDialog: React.FC<FrameworkNoteDialogProps> = ({ 
  note, 
  isOpen, 
  onClose 
}) => {
  if (!note) return null;

  const sectionLabels: Record<string, string> = {
    objectifs: "Objectifs",
    contexte: "Contexte",
    perimetre: "Périmètre",
    parties_prenantes: "Parties prenantes",
    risques: "Risques",
    budget: "Budget",
    planning: "Planning",
    organisation: "Organisation",
    livrables: "Livrables",
    communication: "Communication",
    decision: "Points de décision"
  };

  // Function to get sections with content
  const getSectionsWithContent = () => {
    const sections = [];
    for (const [key, value] of Object.entries(note.content)) {
      if (value && sectionLabels[key]) {
        sections.push({
          key,
          label: sectionLabels[key],
          content: value
        });
      }
    }
    return sections;
  };

  const sectionsWithContent = getSectionsWithContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Note de cadrage (version {note.version})</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> 
            Créée le {formatDate(new Date(note.created_at), 'dd/MM/yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-auto">
          <div className="space-y-6 p-4">
            {sectionsWithContent.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cette note ne contient pas encore de contenu.</p>
              </div>
            )}
            
            {sectionsWithContent.map((section) => (
              <div key={section.key} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{section.label}</h3>
                <div className="prose prose-sm max-w-none">
                  {section.content.split('\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
