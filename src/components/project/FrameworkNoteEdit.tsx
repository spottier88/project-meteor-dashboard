
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface FrameworkNoteEditProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const FrameworkNoteEdit: React.FC<FrameworkNoteEditProps> = ({
  note,
  isOpen,
  onClose,
  projectId
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('objectifs');
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (note && note.content) {
      setFormData(note.content);
    } else {
      setFormData({
        objectifs: '',
        contexte: '',
        perimetre: '',
        parties_prenantes: '',
        risques: '',
        budget: '',
        planning: '',
        organisation: '',
        livrables: '',
        communication: '',
        decision: ''
      });
    }
  }, [note]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (note && note.id) {
        // Update existing note
        const { data, error } = await supabase
          .from('project_framework_notes')
          .update({
            content: formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', note.id)
          .select();

        if (error) throw error;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('project_framework_notes')
          .insert({
            project_id: projectId,
            content: formData,
            version: 1,
            status: 'draft'
          })
          .select();

        if (error) throw error;
      }

      toast({
        title: 'Note enregistrée',
        description: 'La note de cadrage a été sauvegardée avec succès',
      });
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder la note de cadrage',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'objectifs', label: 'Objectifs' },
    { id: 'contexte', label: 'Contexte' },
    { id: 'perimetre', label: 'Périmètre' },
    { id: 'parties_prenantes', label: 'Parties prenantes' },
    { id: 'risques', label: 'Risques' },
    { id: 'budget', label: 'Budget' },
    { id: 'planning', label: 'Planning' },
    { id: 'organisation', label: 'Organisation' },
    { id: 'livrables', label: 'Livrables' },
    { id: 'communication', label: 'Communication' },
    { id: 'decision', label: 'Points de décision' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {note && note.id ? 'Modifier la note de cadrage' : 'Nouvelle note de cadrage'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-grow overflow-hidden">
          <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="flex flex-grow h-full">
            <TabsList className="h-full w-40 flex-shrink-0 flex flex-col items-stretch space-y-1 overflow-auto rounded-none border-r p-2">
              {sections.map(section => (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className="justify-start text-left"
                >
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <ScrollArea className="flex-grow p-4">
              {sections.map(section => (
                <TabsContent 
                  key={section.id} 
                  value={section.id} 
                  className="h-full mt-0 border-0 p-0"
                >
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={section.id}>{section.label}</Label>
                      <Textarea
                        id={section.id}
                        value={formData[section.id] || ''}
                        onChange={(e) => handleInputChange(section.id, e.target.value)}
                        placeholder={`Saisir ${section.label.toLowerCase()}...`}
                        className="min-h-[300px]"
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
