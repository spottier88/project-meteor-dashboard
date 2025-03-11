
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bot, Copy, Check, RefreshCw, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FrameworkNoteGeneratorProps {
  project: any;
}

export const FrameworkNoteGenerator: React.FC<FrameworkNoteGeneratorProps> = ({ project }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [promptSection, setPromptSection] = useState('general');
  const [prompt, setPrompt] = useState(`Génère une note de cadrage pour un projet intitulé "${project.title}".`);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [isGeneratingSection, setIsGeneratingSection] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  const sections = [
    { id: 'all', label: 'Tous' },
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
    { id: 'decision', label: 'Points de décision' },
  ];

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez saisir des instructions pour la génération',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Structure pour stocker le contenu généré
      const generatedSections: Record<string, string> = {};
      
      // Pour chaque section (sauf 'all')
      for (const section of sections.filter(s => s.id !== 'all')) {
        setCurrentSection(section.id);
        
        // Appeler l'Edge Function pour générer le contenu
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            messages: [{ role: 'user', content: `${prompt} Génère spécifiquement la section ${section.label} de la note de cadrage.` }],
            promptType: 'framework_note',
            promptSection: section.id,
            projectId: project.id,
            temperature: 0.7
          }
        });

        if (error) throw error;
        
        if (data && data.message && data.message.content) {
          generatedSections[section.id] = data.message.content;
        } else {
          generatedSections[section.id] = `Aucun contenu généré pour la section ${section.label}`;
        }
      }
      
      setGeneratedContent(generatedSections);
      setCurrentSection(null);
      
      toast({
        title: 'Génération terminée',
        description: 'Le contenu a été généré avec succès pour toutes les sections',
      });
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de générer le contenu. Veuillez réessayer.',
      });
    } finally {
      setIsGenerating(false);
      setCurrentSection(null);
    }
  };

  const handleGenerateSection = async (sectionId: string) => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez saisir des instructions pour la génération',
      });
      return;
    }
    
    if (sectionId === 'all') {
      handleGenerateContent();
      return;
    }

    setIsGeneratingSection(true);
    const section = sections.find(s => s.id === sectionId);
    
    try {
      // Appeler l'Edge Function pour générer le contenu
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: `${prompt} Génère spécifiquement la section ${section?.label} de la note de cadrage.` }],
          promptType: 'framework_note',
          promptSection: sectionId,
          projectId: project.id,
          temperature: 0.7
        }
      });

      if (error) throw error;
      
      if (data && data.message && data.message.content) {
        setGeneratedContent(prev => ({
          ...prev,
          [sectionId]: data.message.content
        }));
        
        toast({
          title: 'Section générée',
          description: `La section ${section?.label} a été générée avec succès`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Aucun contenu n\'a été généré',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la section:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de générer la section',
      });
    } finally {
      setIsGeneratingSection(false);
    }
  };

  const handleSaveNote = async () => {
    // Vérifier si du contenu a été généré
    if (Object.keys(generatedContent).length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez générer du contenu avant d\'enregistrer la note',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('project_framework_notes')
        .insert({
          project_id: project.id,
          content: generatedContent,
          version: 1,
          status: 'draft'
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Note sauvegardée',
        description: 'La note de cadrage a été enregistrée avec succès',
      });
      
      // Réinitialiser l'état
      setGeneratedContent({});
      setActiveTab('all');
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

  const handleCopyContent = (sectionId: string) => {
    const textToCopy = generatedContent[sectionId] || '';
    navigator.clipboard.writeText(textToCopy);
    
    setCopied(prev => ({ ...prev, [sectionId]: true }));
    
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [sectionId]: false }));
    }, 2000);
    
    toast({
      title: 'Copié',
      description: 'Le contenu a été copié dans le presse-papier',
    });
  };

  const visibleSections = activeTab === 'all' 
    ? sections.filter(s => s.id !== 'all') 
    : sections.filter(s => s.id === activeTab);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Assistant IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Instructions pour la génération</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez le projet pour aider l'IA à générer un contenu pertinent..."
                className="h-24"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleGenerateContent} 
                disabled={isGenerating || !prompt.trim()}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer toutes les sections
              </Button>
              <Select
                value={promptSection}
                onValueChange={setPromptSection}
                disabled={isGenerating || isGeneratingSection}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Choisir une section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.filter(s => s.id !== 'all').map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => handleGenerateSection(promptSection)}
                disabled={isGenerating || isGeneratingSection || !prompt.trim()}
                variant="outline"
              >
                {isGeneratingSection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer
              </Button>
            </div>
            {(isGenerating || currentSection) && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Génération en cours
                    {currentSection && ` - Section: ${sections.find(s => s.id === currentSection)?.label}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {Object.keys(generatedContent).length > 0 && (
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full flex flex-wrap h-auto">
              {sections.map(section => (
                <TabsTrigger key={section.id} value={section.id} className="py-2">
                  {section.label}
                  {section.id !== 'all' && generatedContent[section.id] && (
                    <Badge variant="secondary" className="ml-2 bg-green-100">✓</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {visibleSections.map(section => (
              <Card key={section.id} className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {section.label}
                      {generatedContent[section.id] && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Complété</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleGenerateSection(section.id)}
                        disabled={isGenerating || isGeneratingSection}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopyContent(section.id)}
                        disabled={!generatedContent[section.id]}
                      >
                        {copied[section.id] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={generatedContent[section.id] || ''}
                    onChange={(e) => setGeneratedContent(prev => ({
                      ...prev,
                      [section.id]: e.target.value
                    }))}
                    className="min-h-[200px]"
                    placeholder={`Contenu de la section ${section.label}...`}
                  />
                </CardContent>
              </Card>
            ))}
          </Tabs>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveNote} 
              disabled={isSaving || Object.keys(generatedContent).length === 0}
              className="w-full sm:w-auto"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer comme nouvelle note
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
