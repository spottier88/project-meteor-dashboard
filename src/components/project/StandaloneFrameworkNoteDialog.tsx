
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface StandaloneFrameworkNoteDialogProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneFrameworkNoteDialog: React.FC<StandaloneFrameworkNoteDialogProps> = ({ 
  note, 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('all');

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

  const sections = Object.entries(note?.content || {})
    .filter(([key, value]) => value && sectionLabels[key])
    .map(([key, value]) => ({
      id: key,
      label: sectionLabels[key],
      content: value
    }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{note.title || `Note de cadrage v${note.version}`}</span>
            <Badge variant={note.status === 'draft' ? "outline" : "default"}>
              {note.status === 'draft' ? 'Brouillon' : 
               note.status === 'published' ? 'Publiée' : 'Archivée'}
            </Badge>
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Créée le {format(new Date(note.created_at), 'dd/MM/yyyy')}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow overflow-hidden flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Toutes les sections</TabsTrigger>
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-grow">
            <TabsContent value="all" className="mt-0 h-full">
              <div className="space-y-6 p-4">
                {sections.map((section) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{section.label}</h3>
                    <div className="whitespace-pre-line text-sm">
                      {section.content as string}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="mt-0 h-full p-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{section.label}</h3>
                  <div className="whitespace-pre-line text-sm">
                    {section.content as string}
                  </div>
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
