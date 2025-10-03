import { useFramingAIGeneration } from "@/hooks/useFramingAIGeneration";
import { AIGenerateButton } from "@/components/framing/AIGenerateButton";
import { FramingSectionKey } from "@/utils/framingAIHelpers";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Info } from "lucide-react";
import { FramingField } from "./FramingField";

export interface ProjectFormStep4Props {
  context: string;
  setContext: (value: string) => void;
  stakeholders: string;
  setStakeholders: (value: string) => void;
  governance: string;
  setGovernance: (value: string) => void;
  objectives: string;
  setObjectives: (value: string) => void;
  timeline: string;
  setTimeline: (value: string) => void;
  deliverables: string;
  setDeliverables: (value: string) => void;
  // Données du projet pour le contexte IA
  projectTitle?: string;
  projectDescription?: string;
  startDate?: Date;
  endDate?: Date;
  projectManager?: string;
  priority?: string;
  projectId?: string;
}

export const ProjectFormStep4 = ({
  context,
  setContext,
  stakeholders,
  setStakeholders,
  governance,
  setGovernance,
  objectives,
  setObjectives,
  timeline,
  setTimeline,
  deliverables,
  setDeliverables,
  projectTitle,
  projectDescription,
  startDate,
  endDate,
  projectManager,
  priority,
  projectId,
}: ProjectFormStep4Props) => {
  const { generateSection, generateAllSections, isGenerating, generatingSection } = useFramingAIGeneration();

  /**
   * Génère une section individuelle
   */
  const handleGenerateSection = async (section: FramingSectionKey) => {
    // Récupérer le setter et la valeur courante pour la section
    const setters: Record<FramingSectionKey, (value: string) => void> = {
      context: setContext,
      stakeholders: setStakeholders,
      governance: setGovernance,
      objectives: setObjectives,
      timeline: setTimeline,
      deliverables: setDeliverables,
    };

    const currentValues: Record<FramingSectionKey, string> = {
      context,
      stakeholders,
      governance,
      objectives,
      timeline,
      deliverables,
    };

    const projectContext = {
      title: projectTitle,
      description: projectDescription,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      projectManager,
      priority,
    };

    const generated = await generateSection(
      section,
      currentValues[section],
      projectContext,
      projectId
    );

    if (generated) {
      setters[section](generated);
    }
  };

  /**
   * Génère toutes les sections en une fois
   */
  const handleGenerateAll = async () => {
    const sectionsData: Record<FramingSectionKey, string> = {
      context,
      stakeholders,
      governance,
      objectives,
      timeline,
      deliverables,
    };

    const projectContext = {
      title: projectTitle,
      description: projectDescription,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      projectManager,
      priority,
    };

    const generated = await generateAllSections(
      sectionsData,
      projectContext,
      projectId
    );

    if (generated) {
      setContext(generated.context);
      setStakeholders(generated.stakeholders);
      setGovernance(generated.governance);
      setObjectives(generated.objectives);
      setTimeline(generated.timeline);
      setDeliverables(generated.deliverables);
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête avec génération globale */}
      <div className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Vous pouvez saisir quelques notes pour chaque section, puis utiliser l'IA pour
            générer un texte formel et structuré.
          </AlertDescription>
        </Alert>

        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg transition-all duration-300 ${
          generatingSection === 'all'
            ? 'bg-primary/10 border-primary shadow-lg'
            : 'bg-muted/50 hover:bg-muted/70'
        }`}>
          <div className="flex items-start gap-3">
            <Sparkles className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              generatingSection === 'all' ? 'text-primary animate-pulse' : 'text-primary'
            }`} />
            <div className="space-y-1">
              <h3 className="font-semibold">Génération IA complète</h3>
              <p className="text-sm text-muted-foreground">
                Générer toutes les sections en une seule fois
              </p>
            </div>
          </div>
          <AIGenerateButton
            onClick={handleGenerateAll}
            isGenerating={generatingSection === 'all'}
            label="Générer toute la note"
            disabled={isGenerating}
            variant="default"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <Separator className="my-6" />

      {/* Sections de cadrage avec génération individuelle */}
      <div className="space-y-6">
        <FramingField
          id="context"
          section="context"
          value={context}
          onChange={setContext}
          onGenerate={handleGenerateSection}
          isGenerating={isGenerating}
          generatingSection={generatingSection}
        />

        <FramingField
          id="stakeholders"
          section="stakeholders"
          value={stakeholders}
          onChange={setStakeholders}
          onGenerate={handleGenerateSection}
          isGenerating={isGenerating}
          generatingSection={generatingSection}
        />

        <FramingField
          id="governance"
          section="governance"
          value={governance}
          onChange={setGovernance}
          onGenerate={handleGenerateSection}
          isGenerating={isGenerating}
          generatingSection={generatingSection}
        />

        <FramingField
          id="objectives"
          section="objectives"
          value={objectives}
          onChange={setObjectives}
          onGenerate={handleGenerateSection}
          isGenerating={isGenerating}
          generatingSection={generatingSection}
        />

        <FramingField
          id="timeline"
          section="timeline"
          value={timeline}
          onChange={setTimeline}
          onGenerate={handleGenerateSection}
          isGenerating={isGenerating}
          generatingSection={generatingSection}
        />

        <FramingField
          id="deliverables"
          section="deliverables"
          value={deliverables}
          onChange={setDeliverables}
          onGenerate={handleGenerateSection}
          isGenerating={isGenerating}
          generatingSection={generatingSection}
        />
      </div>

      {/* Indicateur de progression pour génération globale */}
      {generatingSection === 'all' && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-background border shadow-lg rounded-lg p-4 flex items-center gap-3 max-w-xs">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <div className="flex-1">
              <p className="font-medium text-sm">Génération en cours</p>
              <p className="text-xs text-muted-foreground">
                Génération de toutes les sections...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
