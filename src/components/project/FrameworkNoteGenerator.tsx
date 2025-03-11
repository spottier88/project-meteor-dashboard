
import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bot, Copy, Check, RefreshCw, ArrowRight, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FrameworkNoteGeneratorProps {
  project: any;
}

export const FrameworkNoteGenerator: React.FC<FrameworkNoteGeneratorProps> = ({ project }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState('objectifs');
  const [activeTab, setActiveTab] = useState('editor');
  const [prompt, setPrompt] = useState(`Génère une note de cadrage pour un projet intitulé "${project.title}".`);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

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

  useEffect(() => {
    // Calculer le pourcentage de progression
    const filledSections = Object.keys(generatedContent).filter(key => 
      generatedContent[key] && generatedContent[key].trim() !== ''
    );
    
    setCompletedSections(filledSections);
    const percentage = Math.round((filledSections.length / sections.length) * 100);
    setProgress(percentage);
  }, [generatedContent]);

  const generateWithAI = async (sectionToGenerate: string, customPrompt?: string) => {
    setIsGenerating(true);
    
    try {
      const sectionLabel = sections.find(s => s.id === sectionToGenerate)?.label || sectionToGenerate;
      const sectionPrompt = customPrompt || `Génère la section "${sectionLabel}" pour une note de cadrage du projet "${project.title}". ${project.description ? `Description du projet: ${project.description}` : ''}`;
      
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
            content: sectionPrompt 
          }],
          projectId: project.id,
          promptType: 'framework_note',
          promptSection: sectionToGenerate
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API:', errorText);
        throw new Error(`Erreur lors de la génération: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.message.content;

      setGeneratedContent(prev => ({
        ...prev,
        [sectionToGenerate]: generatedText
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
        description: 'Impossible de générer le contenu. Veuillez réessayer.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCurrentSection = () => {
    generateWithAI(selectedSection);
  };

  const handleGenerateAllSections = async () => {
    try {
      for (const section of sections) {
        await generateWithAI(section.id);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de toutes les sections:', error);
    }
  };

  const handleRegenerateSection = (sectionId: string) => {
    generateWithAI(sectionId);
  };

  const handleSaveNote = async () => {
    if (Object.keys(generatedContent).length === 0) {
      toast({
        variant: 'destructive',
        title: 'Impossible de sauvegarder',
        description: 'Veuillez générer du contenu avant de sauvegarder',
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
      setActiveTab('editor');
      setSelectedSection('objectifs');
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

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  const handleNextSection = () => {
    const currentIndex = sections.findIndex(s => s.id === selectedSection);
    if (currentIndex < sections.length - 1) {
      setSelectedSection(sections[currentIndex + 1].id);
    }
  };

  const handlePreviousSection = () => {
    const currentIndex = sections.findIndex(s => s.id === selectedSection);
    if (currentIndex > 0) {
      setSelectedSection(sections[currentIndex - 1].id);
    }
  };

  const SectionNavigator = () => (
    <div className="flex justify-between items-center mb-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePreviousSection}
        disabled={selectedSection === sections[0].id}
      >
        Section précédente
      </Button>
      <div className="text-sm text-muted-foreground">
        Section {sections.findIndex(s => s.id === selectedSection) + 1} sur {sections.length}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleNextSection}
        disabled={selectedSection === sections[sections.length - 1].id}
      >
        Section suivante
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="w-full bg-muted p-2 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">Progression: {progress}%</div>
          <div className="text-sm text-muted-foreground">
            {completedSections.length}/{sections.length} sections
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Éditeur</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="instructions">
          <Card>
            <CardHeader>
              <CardTitle>Comment utiliser l'assistant de génération</CardTitle>
              <CardDescription>
                Suivez ces étapes pour générer une note de cadrage complète
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-2">1. Générer du contenu</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Vous pouvez générer le contenu de chaque section individuellement ou toutes les sections en une seule fois.
                </p>
                <p className="text-sm text-muted-foreground">
                  Le contenu généré est basé sur les informations du projet et peut être modifié selon vos besoins.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-2">2. Personnaliser chaque section</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Naviguez entre les sections à l'aide des boutons "Section précédente" et "Section suivante".
                </p>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez régénérer une section si le contenu ne vous convient pas.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-2">3. Enregistrer la note</h3>
                <p className="text-sm text-muted-foreground">
                  Une fois satisfait du contenu, cliquez sur "Enregistrer comme nouvelle note" pour sauvegarder la note de cadrage.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Assistant IA
              </CardTitle>
              <CardDescription>
                Générez la section "{sections.find(s => s.id === selectedSection)?.label}" de votre note de cadrage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <SectionNavigator />
                
                <div className="flex space-x-2 mb-4">
                  {sections.map((section) => (
                    <Badge
                      key={section.id}
                      variant={section.id === selectedSection ? "default" : 
                        (completedSections.includes(section.id) ? "outline" : "secondary")}
                      className="cursor-pointer"
                      onClick={() => handleSectionChange(section.id)}
                    >
                      {section.label}
                      {completedSections.includes(section.id) && <Check className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="section-content">Contenu de la section</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateSection(selectedSection)}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Régénérer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyContent(selectedSection)}
                        disabled={!generatedContent[selectedSection]}
                      >
                        {copied[selectedSection] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copier
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="section-content"
                    value={generatedContent[selectedSection] || ''}
                    onChange={(e) => setGeneratedContent(prev => ({
                      ...prev,
                      [selectedSection]: e.target.value
                    }))}
                    placeholder={`Le contenu de la section ${sections.find(s => s.id === selectedSection)?.label} apparaîtra ici...`}
                    className="min-h-[200px]"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleGenerateCurrentSection} 
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Générer cette section
                  </Button>
                  <Button 
                    onClick={handleGenerateAllSections} 
                    disabled={isGenerating}
                    variant="outline"
                  >
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tout générer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu de la note</CardTitle>
              <CardDescription>
                Vérifiez le contenu de toutes les sections avant d'enregistrer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={section.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg">{section.label}</h3>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateSection(section.id)}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyContent(section.id)}
                        >
                          {copied[section.id] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {generatedContent[section.id] ? (
                      <div className="whitespace-pre-line text-sm">
                        {generatedContent[section.id]}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        Aucun contenu généré pour cette section
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button 
        onClick={handleSaveNote} 
        disabled={isSaving || Object.keys(generatedContent).length === 0}
        className="w-full"
        variant="default"
      >
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Enregistrer comme nouvelle note
      </Button>
    </div>
  );
};
