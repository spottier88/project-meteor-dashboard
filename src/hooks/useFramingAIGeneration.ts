/**
 * Hook personnalisé pour la génération IA des sections de cadrage
 * 
 * Gère l'état de chargement, les erreurs, et les appels à l'API
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  generateFramingSection, 
  generateAllFramingSections,
  FramingSectionKey,
  ProjectContextForAI 
} from '@/utils/framingAIHelpers';

interface UseFramingAIGenerationReturn {
  /**
   * Génère une seule section
   */
  generateSection: (
    section: FramingSectionKey,
    userInput: string,
    projectContext: ProjectContextForAI,
    projectId?: string
  ) => Promise<string | null>;
  
  /**
   * Génère toutes les sections en une fois
   */
  generateAllSections: (
    sectionsData: Record<FramingSectionKey, string>,
    projectContext: ProjectContextForAI,
    projectId?: string
  ) => Promise<Record<FramingSectionKey, string> | null>;
  
  /**
   * Indique si une génération est en cours
   */
  isGenerating: boolean;
  
  /**
   * Indique quelle section est en cours de génération
   */
  generatingSection: FramingSectionKey | 'all' | null;
}

export function useFramingAIGeneration(): UseFramingAIGenerationReturn {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<FramingSectionKey | 'all' | null>(null);

  /**
   * Génère une seule section de cadrage
   */
  const generateSection = async (
    section: FramingSectionKey,
    userInput: string,
    projectContext: ProjectContextForAI,
    projectId?: string
  ): Promise<string | null> => {
    setIsGenerating(true);
    setGeneratingSection(section);

    try {
      const generated = await generateFramingSection(
        section,
        userInput,
        projectContext,
        projectId
      );

      toast({
        title: "Génération réussie",
        description: "Le texte a été généré avec succès.",
      });

      return generated;
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      
      toast({
        title: "Erreur de génération",
        description: error instanceof Error 
          ? error.message 
          : "Une erreur est survenue lors de la génération du texte.",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsGenerating(false);
      setGeneratingSection(null);
    }
  };

  /**
   * Génère toutes les sections de cadrage en parallèle
   */
  const generateAllSections = async (
    sectionsData: Record<FramingSectionKey, string>,
    projectContext: ProjectContextForAI,
    projectId?: string
  ): Promise<Record<FramingSectionKey, string> | null> => {
    setIsGenerating(true);
    setGeneratingSection('all');

    try {
      const generated = await generateAllFramingSections(
        sectionsData,
        projectContext,
        projectId
      );

      toast({
        title: "Génération réussie",
        description: "Toutes les sections ont été générées avec succès.",
      });

      return generated;
    } catch (error) {
      console.error('Erreur lors de la génération globale:', error);
      
      toast({
        title: "Erreur de génération",
        description: error instanceof Error 
          ? error.message 
          : "Une erreur est survenue lors de la génération des sections.",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsGenerating(false);
      setGeneratingSection(null);
    }
  };

  return {
    generateSection,
    generateAllSections,
    isGenerating,
    generatingSection,
  };
}
