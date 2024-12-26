import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FilterToggleProps {
  showDgsOnly: boolean;
  onToggle: (checked: boolean) => void;
}

export const FilterToggle = ({ showDgsOnly, onToggle }: FilterToggleProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="dgs-filter"
        checked={showDgsOnly}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="dgs-filter">Afficher uniquement les projets suivis DGS</Label>
    </div>
  );
};