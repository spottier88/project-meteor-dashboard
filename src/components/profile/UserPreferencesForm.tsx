
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export const UserPreferencesForm = () => {
  const { preferences, updatePreferences, isUpdating } = useUserPreferences();

  const handleToggleNewTab = (checked: boolean) => {
    updatePreferences({
      open_projects_in_new_tab: checked,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Navigation</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="open-projects-new-tab">
              Ouvrir les projets dans un nouvel onglet
            </Label>
            <p className="text-sm text-muted-foreground">
              Les liens vers les projets s'ouvriront dans un nouvel onglet
            </p>
          </div>
          <Switch
            id="open-projects-new-tab"
            checked={preferences.open_projects_in_new_tab}
            onCheckedChange={handleToggleNewTab}
            disabled={isUpdating}
          />
        </div>
      </div>
    </div>
  );
};
