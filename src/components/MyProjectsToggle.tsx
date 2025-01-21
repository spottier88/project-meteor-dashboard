import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MyProjectsToggleProps {
  showMyProjectsOnly: boolean;
  onToggle: (checked: boolean) => void;
}

export const MyProjectsToggle = ({ showMyProjectsOnly, onToggle }: MyProjectsToggleProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="my-projects-filter"
        checked={showMyProjectsOnly}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="my-projects-filter">Mes projets</Label>
    </div>
  );
};