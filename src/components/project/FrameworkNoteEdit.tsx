
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('objectifs');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);

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

  useEffect(() => {
    // Calculer le pourcentage de progression
    const sections = Object.keys(formData);
    const filledSections = sections.filter(key => formData[key] && formData[key].trim() !== '');
    setCompletedSections(filledSections);
    
    const percentage = sections.length > 0 ? Math.round((filledSections.length / sections.length) * 100) : 0;
    setProgress(percentage);
  }, [formData]);

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

  const handleNextSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeTab);
    if (currentIndex < sections.length - 1) {
      setActiveTab(sections[currentIndex + 1].id);
    }
  };

  const handlePrevSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(sections[currentIndex - 1].id);
    }
  };

  const handleRegenerateSection = async (sectionId: string) => {
    setIsGenerating(true);
    
    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('title, description')
        .eq('id', projectId)
        .single();
      
      const sectionLabel = sections.find(s => s.id === sectionId)?.label || sectionId;
      const projectTitle = projectData?.title || '';
      const projectDescription = projectData?.description || '';
      
      // Appel à l'API fonction Edge Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const authHeader = sessionData?.session?.access_token
        ? `Bearer ${sessionData.session.access_token}`
        : null;

      if (!authHeader) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Génère la section "${sectionLabel}" pour une note de cadrage du projet "${projectTitle}". ${projectDescription ? `Description du projet: ${projectDescription}` : ''}` 
          }],
          projectId: projectId,
          promptType: 'framework_note',
          promptSection: sectionId
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la génération: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.message.content;

      setFormData(prev => ({
        ...prev,
        [sectionId]: generatedText
      }));
      
      toast({
        title: 'Génération terminée',
        description: `La section "${sectionLabel}" a été générée avec succès`,
      });
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de générer le contenu',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const SectionNavigator = () => (
    <div className="flex justify-between items-center mb-4 px-4 border-b pb-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePrevSection}
        disabled={activeTab === sections[0].id}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Section précédente
      </Button>
      <div className="text-sm">
        Section {sections.findIndex(s => s.id === activeTab) + 1} sur {sections.length}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleNextSection}
        disabled={activeTab === sections[sections.length - 1].id}
      >
        Section suivante
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {note && note.id ? 'Modifier la note de cadrage' : 'Nouvelle note de cadrage'}
          </DialogTitle>
        </DialogHeader>

        <div className="w-full bg-muted p-2 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Progression: {progress}%</div>
            <div className="text-sm text-muted-foreground">
              {completedSections.length}/{sections.length} sections complétées
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex flex-grow overflow-hidden">
          <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="flex flex-grow h-full">
            <TabsList className="h-full w-40 flex-shrink-0 flex flex-col items-stretch space-y-1 overflow-auto rounded-none border-r p-2">
              {sections.map(section => (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className="justify-between text-left"
                >
                  {section.label}
                  {completedSections.includes(section.id) && (
                    <Badge variant="outline" className="ml-1 px-1 py-0 h-5 w-5 flex items-center justify-center">✓</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex flex-col flex-grow">
              <SectionNavigator />
              
              <ScrollArea className="flex-grow p-4">
                {sections.map(section => (
                  <TabsContent 
                    key={section.id} 
                    value={section.id} 
                    className="h-full mt-0 border-0 p-0"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={section.id}>{section.label}</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateSection(section.id)}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Régénérer
                        </Button>
                      </div>
                      <Textarea
                        id={section.id}
                        value={formData[section.id] || ''}
                        onChange={(e) => handleInputChange(section.id, e.target.value)}
                        placeholder={`Saisir ${section.label.toLowerCase()}...`}
                        className="min-h-[300px]"
                      />
                    </div>
                  </TabsContent>
                ))}
              </ScrollArea>
            </div>
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
