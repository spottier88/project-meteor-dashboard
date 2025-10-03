import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AIGenerateButton } from "@/components/framing/AIGenerateButton";
import { FRAMING_SECTION_MAPPING, FramingSectionKey } from "@/utils/framingAIHelpers";
import { Sparkles } from "lucide-react";

/**
 * Props pour le composant FramingField
 */
interface FramingFieldProps {
  id: string;
  section: FramingSectionKey;
  value: string;
  onChange: (value: string) => void;
  onGenerate: (section: FramingSectionKey) => void;
  isGenerating: boolean;
  generatingSection: FramingSectionKey | 'all' | null;
}

/**
 * Composant pour une section de cadrage avec génération IA
 * Extrait en composant séparé pour éviter les problèmes de focus
 */
export const FramingField = ({
  id,
  section,
  value,
  onChange,
  onGenerate,
  isGenerating,
  generatingSection,
}: FramingFieldProps) => {
  const config = FRAMING_SECTION_MAPPING[section];
  const isSectionGenerating = generatingSection === section;
  const isOtherSectionGenerating = isGenerating && !isSectionGenerating;

  return (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="flex-1">{config.label}</Label>
        <div className="flex-shrink-0">
          <AIGenerateButton
            onClick={() => onGenerate(section)}
            isGenerating={isSectionGenerating}
            iconOnly
            tooltipText={`Générer "${config.label}" avec l'IA`}
            disabled={isGenerating}
            size="sm"
            className={`${
              isSectionGenerating
                ? 'ring-2 ring-primary ring-offset-2'
                : ''
            }`}
          />
        </div>
      </div>
      <div className="relative">
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className={`min-h-[100px] transition-all duration-300 ${
            isSectionGenerating
              ? 'border-primary shadow-lg animate-pulse'
              : isOtherSectionGenerating
              ? 'opacity-50'
              : 'group-hover:border-muted-foreground/30'
          } ${value ? 'animate-fade-in' : ''}`}
          disabled={isSectionGenerating}
        />
        {isSectionGenerating && (
          <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md animate-fade-in">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Génération en cours...
          </div>
        )}
      </div>
    </div>
  );
};
