
import React from 'react';
import { Dialog, DialogContent, DialogHeader, 
         DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CalendarDays, FileDown, Copy, Check } from 'lucide-react';
import { formatDate } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

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

  const handleCopySection = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedSection(key);
    
    toast({
      title: 'Section copiée',
      description: 'Le contenu a été copié dans le presse-papier'
    });
    
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const sectionsWithContent = getSectionsWithContent();
  const statusBadgeVariant = note.status === 'draft' ? 'secondary' : 'default';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Note de cadrage (version {note.version})
              <Badge variant={statusBadgeVariant}>
                {note.status === 'draft' ? 'Brouillon' : 'Publiée'}
              </Badge>
            </DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> 
            Créée le {formatDate(new Date(note.created_at), 'dd/MM/yyyy')}
            {note.created_by && (
              <span className="text-xs ml-2">
                par {note.created_by}
              </span>
            )}
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
              <div key={section.key} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">{section.label}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopySection(section.key, section.content as string)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedSection === section.key ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Separator className="my-2" />
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-line text-sm">
                    {section.content}
                  </div>
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
