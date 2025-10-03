/**
 * Helpers et configuration pour la génération IA des notes de cadrage
 * 
 * Ce fichier définit le mapping entre les champs du formulaire de projet (Step 4)
 * et les sections des templates IA dans la base de données.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Type pour les sections de cadrage dans le formulaire
 */
export type FramingSectionKey = 
  | 'context' 
  | 'stakeholders' 
  | 'governance' 
  | 'objectives' 
  | 'timeline' 
  | 'deliverables';

/**
 * Type pour les sections de templates IA
 */
export type AITemplateSectionKey = 
  | 'contexte' 
  | 'parties_prenantes' 
  | 'organisation' 
  | 'objectifs' 
  | 'planning' 
  | 'livrables';

/**
 * Configuration du mapping entre les sections du formulaire et les sections IA
 */
export const FRAMING_SECTION_MAPPING: Record<FramingSectionKey, {
  aiSection: AITemplateSectionKey;
  label: string;
  placeholder: string;
}> = {
  context: {
    aiSection: 'contexte',
    label: 'Contexte du projet',
    placeholder: 'Décrivez le contexte, les enjeux et la raison d\'être du projet'
  },
  stakeholders: {
    aiSection: 'parties_prenantes',
    label: 'Parties prenantes',
    placeholder: 'Listez les acteurs concernés par le projet'
  },
  governance: {
    aiSection: 'organisation',
    label: 'Gouvernance',
    placeholder: 'Décrivez l\'organisation du projet et les instances décisionnelles'
  },
  objectives: {
    aiSection: 'objectifs',
    label: 'Objectifs',
    placeholder: 'Définissez les objectifs SMART du projet'
  },
  timeline: {
    aiSection: 'planning',
    label: 'Planning prévisionnel',
    placeholder: 'Décrivez les principales échéances et jalons'
  },
  deliverables: {
    aiSection: 'livrables',
    label: 'Livrables attendus',
    placeholder: 'Décrivez les résultats attendus du projet'
  }
};

/**
 * Type pour le contexte du projet à fournir à l'IA
 */
export interface ProjectContextForAI {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  projectManager?: string;
  priority?: string;
}

/**
 * Génère une section de cadrage via l'IA
 * 
 * @param section - La section du formulaire à générer
 * @param userInput - Le texte saisi par l'utilisateur (peut être des notes brèves)
 * @param projectContext - Les informations du projet pour contextualiser
 * @param projectId - L'ID du projet (optionnel, pour récupérer plus d'infos côté serveur)
 * @param conversationId - L'ID de la conversation IA pour tracer l'utilisation
 * @returns Le texte généré par l'IA
 */
export async function generateFramingSection(
  section: FramingSectionKey,
  userInput: string,
  projectContext: ProjectContextForAI,
  projectId?: string,
  conversationId?: string
): Promise<string> {
  const mapping = FRAMING_SECTION_MAPPING[section];
  
  // Construire le message utilisateur
  const userMessage = `
Projet: ${projectContext.title || 'Non défini'}
${projectContext.description ? `Description: ${projectContext.description}` : ''}
${projectContext.startDate ? `Date de début: ${projectContext.startDate}` : ''}
${projectContext.endDate ? `Date de fin: ${projectContext.endDate}` : ''}
${projectContext.projectManager ? `Chef de projet: ${projectContext.projectManager}` : ''}

Section à générer: ${mapping.label}

Notes de l'utilisateur:
${userInput || 'Aucune note fournie, générez un contenu générique mais pertinent pour cette section.'}

Veuillez générer un texte professionnel et structuré pour la section "${mapping.label}" de la note de cadrage.
  `.trim();

  // Appeler la Edge function ai-assistant
  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: {
      messages: [
        { role: 'user', content: userMessage }
      ],
      conversationId: conversationId,
      promptType: 'framework_note',
      promptSection: mapping.aiSection,
      projectId: projectId,
      maxTokens: 800,
      temperature: 0.7
    }
  });

  if (error) {
    console.error('Erreur lors de la génération de la section:', error);
    throw new Error(`Erreur lors de la génération: ${error.message}`);
  }

  if (!data || !data.message || !data.message.content) {
    throw new Error('Réponse invalide de l\'IA');
  }

  return data.message.content;
}

/**
 * Génère toutes les sections de cadrage en parallèle
 * 
 * @param sectionsData - Objet contenant les données de toutes les sections
 * @param projectContext - Les informations du projet
 * @param projectId - L'ID du projet (optionnel)
 * @param conversationId - L'ID de la conversation IA pour tracer l'utilisation
 * @returns Un objet avec toutes les sections générées
 */
export async function generateAllFramingSections(
  sectionsData: Record<FramingSectionKey, string>,
  projectContext: ProjectContextForAI,
  projectId?: string,
  conversationId?: string
): Promise<Record<FramingSectionKey, string>> {
  // Générer toutes les sections en parallèle
  const sectionKeys = Object.keys(FRAMING_SECTION_MAPPING) as FramingSectionKey[];
  
  const generationPromises = sectionKeys.map(async (key) => {
    try {
      const generated = await generateFramingSection(
        key,
        sectionsData[key],
        projectContext,
        projectId,
        conversationId
      );
      return { key, content: generated };
    } catch (error) {
      console.error(`Erreur lors de la génération de ${key}:`, error);
      return { key, content: sectionsData[key] }; // Garder le contenu original en cas d'erreur
    }
  });

  const results = await Promise.all(generationPromises);
  
  // Transformer en objet
  return results.reduce((acc, { key, content }) => {
    acc[key] = content;
    return acc;
  }, {} as Record<FramingSectionKey, string>);
}
