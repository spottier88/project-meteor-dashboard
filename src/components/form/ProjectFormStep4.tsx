
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProjectFormStep4Props {
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
}: ProjectFormStep4Props) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="context">Contexte du projet</Label>
        <Textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Expliquez le contexte général du projet, les enjeux et la raison d'être"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="stakeholders">Parties prenantes</Label>
        <Textarea
          id="stakeholders"
          value={stakeholders}
          onChange={(e) => setStakeholders(e.target.value)}
          placeholder="Listez les acteurs concernés par le projet (internes et externes)"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="governance">Gouvernance</Label>
        <Textarea
          id="governance"
          value={governance}
          onChange={(e) => setGovernance(e.target.value)}
          placeholder="Décrivez l'organisation du projet et les instances décisionnelles"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="objectives">Objectifs</Label>
        <Textarea
          id="objectives"
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          placeholder="Présentez les objectifs SMART du projet"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="timeline">Planning prévisionnel</Label>
        <Textarea
          id="timeline"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="Décrivez les principales échéances et jalons du projet"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="deliverables">Livrables attendus</Label>
        <Textarea
          id="deliverables"
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
          placeholder="Décrivez les résultats attendus du projet"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
};
