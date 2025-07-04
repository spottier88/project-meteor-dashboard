
/**
 * @component UserPreferencesForm
 * @description Formulaire de configuration des préférences utilisateur.
 * Permet de configurer les options comme l'ouverture des projets dans un nouvel onglet.
 */

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Loader2 } from "lucide-react";

export const UserPreferencesForm = () => {
  const { preferences, isLoading, updatePreferences, getPreference } = useUserPreferences();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Chargement des préférences...</span>
      </div>
    );
  }

  const handleToggleNewTab = (checked: boolean) => {
    updatePreferences({ open_projects_in_new_tab: checked });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
          <CardDescription>
            Configurez votre expérience de navigation dans l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="open-new-tab">Ouvrir les projets dans un nouvel onglet</Label>
              <p className="text-sm text-muted-foreground">
                Lorsque vous cliquez sur un projet, il s'ouvrira dans un nouvel onglet plutôt que dans l'onglet actuel
              </p>
            </div>
            <Switch
              id="open-new-tab"
              checked={getPreference('open_projects_in_new_tab', false)}
              onCheckedChange={handleToggleNewTab}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
