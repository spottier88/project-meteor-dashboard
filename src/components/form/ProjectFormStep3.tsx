import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { InnovationRadarChart } from "../innovation/InnovationRadarChart";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ProjectFormStep3Props {
  novateur: number;
  setNovateur: (value: number) => void;
  usager: number;
  setUsager: (value: number) => void;
  ouverture: number;
  setOuverture: (value: number) => void;
  agilite: number;
  setAgilite: (value: number) => void;
  impact: number;
  setImpact: (value: number) => void;
}

const criteriaDescriptions = {
  novateur: "Évalue le degré d'innovation et d'originalité du projet",
  usager: "Mesure la prise en compte des besoins des utilisateurs",
  ouverture: "Évalue le niveau de collaboration et de co-construction",
  agilite: "Mesure la capacité d'adaptation et d'expérimentation",
  impact: "Évalue l'impact potentiel du projet sur l'organisation"
};

export const ProjectFormStep3 = ({
  novateur,
  setNovateur,
  usager,
  setUsager,
  ouverture,
  setOuverture,
  agilite,
  setAgilite,
  impact,
  setImpact,
}: ProjectFormStep3Props) => {
  const innovationData = {
    novateur,
    usager,
    ouverture,
    agilite,
    impact,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {Object.entries(criteriaDescriptions).map(([key, description]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={key} className="font-medium">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                id={key}
                min={0}
                max={5}
                step={1}
                value={[innovationData[key as keyof typeof innovationData]]}
                onValueChange={(value) => {
                  switch (key) {
                    case "novateur":
                      setNovateur(value[0]);
                      break;
                    case "usager":
                      setUsager(value[0]);
                      break;
                    case "ouverture":
                      setOuverture(value[0]);
                      break;
                    case "agilite":
                      setAgilite(value[0]);
                      break;
                    case "impact":
                      setImpact(value[0]);
                      break;
                  }
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>5</span>
              </div>
            </div>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <InnovationRadarChart data={innovationData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};