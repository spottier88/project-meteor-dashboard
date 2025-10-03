import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFramingAIGeneration } from "@/hooks/useFramingAIGeneration";
import { AIGenerateButton } from "@/components/framing/AIGenerateButton";
import { FRAMING_SECTION_MAPPING, FramingSectionKey } from "@/utils/framingAIHelpers";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Info } from "lucide-react";

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

  /**
   * Composant pour une section de cadrage avec génération IA
   */
  const FramingField = ({
    id,
    section,
    value,
    onChange,
  }: {
    id: string;
    section: FramingSectionKey;
    value: string;
    onChange: (value: string) => void;
  }) => {
    const config = FRAMING_SECTION_MAPPING[section];
    const isSectionGenerating = generatingSection === section;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{config.label}</Label>
          <AIGenerateButton
            onClick={() => handleGenerateSection(section)}
            isGenerating={isSectionGenerating}
            iconOnly
            tooltipText={`Générer "${config.label}" avec l'IA`}
            disabled={isGenerating}
            size="sm"
          />
        </div>
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className="min-h-[100px] transition-all"
          disabled={isSectionGenerating}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec génération globale */}
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Vous pouvez saisir quelques notes pour chaque section, puis utiliser l'IA pour
            générer un texte formel et structuré.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
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
          />
        </div>
      </div>

      <Separator />

      {/* Sections de cadrage avec génération individuelle */}
      <FramingField
        id="context"
        section="context"
        value={context}
        onChange={setContext}
      />

      <FramingField
        id="stakeholders"
        section="stakeholders"
        value={stakeholders}
        onChange={setStakeholders}
      />

      <FramingField
        id="governance"
        section="governance"
        value={governance}
        onChange={setGovernance}
      />

      <FramingField
        id="objectives"
        section="objectives"
        value={objectives}
        onChange={setObjectives}
      />

      <FramingField
        id="timeline"
        section="timeline"
        value={timeline}
        onChange={setTimeline}
      />

      <FramingField
        id="deliverables"
        section="deliverables"
        value={deliverables}
        onChange={setDeliverables}
      />
    </div>
  );
};
