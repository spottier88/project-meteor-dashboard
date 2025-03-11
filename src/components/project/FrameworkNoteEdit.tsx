
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ChevronLeft, ChevronRight, Save, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (note && note.content) {
      setFormData(note.content);
      
      // Détermine les sections complétées
      const completed: string[] = [];
      Object.entries(note.content).forEach(([key, value]) => {
        if (value && String(value).trim() !== '') {
          completed.push(key);
        }
      });
      setCompletedSections(completed);
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
      setCompletedSections([]);
    }
  }, [note]);

  useEffect(() => {
    // Calculer le pourcentage de progression
    const completedCount = completedSections.length;
    const totalSections = sections.length;
    const progressPercentage = totalSections > 0 ? (completedCount / totalSections) * 100 : 0;
    setProgress(progressPercentage);
  }, [completedSections]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));

    // Mettre à jour les sections complétées
    const isCompleted = value.trim() !== '';
    if (isCompleted && !completedSections.includes(key)) {
      setCompletedSections(prev => [...prev, key]);
    } else if (!isCompleted && completedSections.includes(key)) {
      setCompletedSections(prev => prev.filter(section => section !== key));
    }
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

  const currentSectionIndex = sections.findIndex(section => section.id === activeTab);

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setActiveTab(sections[currentSectionIndex - 1].id);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setActiveTab(sections[currentSectionIndex + 1].id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {note && note.id ? 'Modifier la note de cadrage' : 'Nouvelle note de cadrage'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progression: {Math.round(progress)}%</span>
            <span className="text-sm text-muted-foreground">
              {completedSections.length}/{sections.length} sections
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex flex-grow overflow-hidden">
          <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="flex flex-grow h-full">
            <TabsList className="h-full w-48 flex-shrink-0 flex flex-col items-stretch space-y-1 overflow-auto rounded-none border-r p-2">
              {sections.map(section => (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className="justify-start text-left relative"
                >
                  {section.label}
                  {completedSections.includes(section.id) && (
                    <Badge variant="secondary" className="ml-auto h-5 w-5 p-0 flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </Badge>
                  )}
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
                      <Label htmlFor={section.id} className="text-lg font-medium">
                        {section.label}
                      </Label>
                      <Textarea
                        id={section.id}
                        value={formData[section.id] || ''}
                        onChange={(e) => handleInputChange(section.id, e.target.value)}
                        placeholder={`Saisir ${section.label.toLowerCase()}...`}
                        className="min-h-[300px] mt-2"
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handlePrevSection}
                        disabled={currentSectionIndex === 0}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleNextSection}
                        disabled={currentSectionIndex === sections.length - 1}
                        className="flex items-center gap-1"
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="gap-1">
            <X className="h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-1">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
