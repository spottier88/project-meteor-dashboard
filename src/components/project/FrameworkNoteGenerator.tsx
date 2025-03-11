
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bot, Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FrameworkNoteGeneratorProps {
  project: any;
}

export const FrameworkNoteGenerator: React.FC<FrameworkNoteGeneratorProps> = ({ project }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [prompt, setPrompt] = useState(`Génère une note de cadrage pour un projet intitulé "${project.title}".`);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

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
    setIsGenerating(true);
    
    try {
      // Simuler un appel à l'API pour générer du contenu (à remplacer par un vrai appel API)
      const mockGeneratedContent = {
        objectifs: "Ce projet vise à améliorer l'expérience utilisateur et la performance du système de gestion de projet existant. Les objectifs principaux sont :\n- Réduire de 30% le temps nécessaire pour créer et suivre des projets\n- Améliorer la visualisation des données de projet\n- Faciliter la collaboration entre les équipes",
        contexte: "Le système actuel présente des limitations en termes d'ergonomie et de rapidité d'exécution. Les utilisateurs rapportent des difficultés à naviguer dans l'interface et à trouver les informations dont ils ont besoin rapidement.",
        perimetre: "Le projet couvre la refonte de l'interface utilisateur, l'optimisation des requêtes de base de données, et l'ajout de nouvelles fonctionnalités de reporting. Il ne comprend pas la migration des données existantes ni la refonte complète de l'architecture.",
        parties_prenantes: "- Équipe de développement\n- Chefs de projet\n- Utilisateurs finaux\n- Direction informatique\n- Sponsors du projet",
        risques: "- Résistance au changement des utilisateurs\n- Complexité technique de l'intégration avec les systèmes existants\n- Dépassement des délais dû à des exigences changeantes",
        budget: "Budget total estimé : 150 000€\n- Développement: 100 000€\n- Tests: 20 000€\n- Formation: 15 000€\n- Contingence: 15 000€",
        planning: "- Phase d'analyse : 2 mois\n- Phase de développement : 4 mois\n- Phase de test : 1 mois\n- Déploiement : 2 semaines",
        organisation: "- Chef de projet : [à déterminer]\n- Équipe de développement : 5 développeurs\n- Testeurs : 2 personnes\n- Expert métier : 1 personne",
        livrables: "- Interface utilisateur refondue\n- Documentation technique\n- Guide utilisateur\n- Rapport de performance",
        communication: "- Réunions hebdomadaires de suivi\n- Rapports mensuels à la direction\n- Démonstrations aux utilisateurs à la fin de chaque sprint",
        decision: "- Validation des maquettes : J+30\n- Choix des technologies : J+15\n- Validation du plan de test : J+90"
      };

      // Attendre un peu pour simuler le temps de génération
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGeneratedContent(mockGeneratedContent);
      
      toast({
        title: 'Génération terminée',
        description: 'Le contenu a été généré avec succès',
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

  const handleSaveNote = async () => {
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
            <Button 
              onClick={handleGenerateContent} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Générer le contenu
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.keys(generatedContent).length > 0 && (
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full flex flex-wrap">
              {sections.map(section => (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {visibleSections.map(section => (
              <Card key={section.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-base flex justify-between">
                    {section.label}
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={generatedContent[section.id] || ''}
                    onChange={(e) => setGeneratedContent(prev => ({
                      ...prev,
                      [section.id]: e.target.value
                    }))}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            ))}
          </Tabs>

          <Button 
            onClick={handleSaveNote} 
            disabled={isSaving || Object.keys(generatedContent).length === 0}
            className="w-full"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer comme nouvelle note
          </Button>
        </div>
      )}
    </div>
  );
};
