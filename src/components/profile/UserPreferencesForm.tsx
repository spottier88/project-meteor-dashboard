
/**
 * @component UserPreferencesForm
 * @description Formulaire de configuration des préférences utilisateur.
 * Permet de configurer les options comme l'ouverture des projets dans un nouvel onglet.
 */

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Loader2, Cookie } from "lucide-react";

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

  const handleVisualizationModeChange = (value: 'classic' | 'cookies') => {
    updatePreferences({ points_visualization_mode: value });
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

      <Card>
        <CardHeader>
          <CardTitle>Affichage des points</CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez visualiser vos points d'activité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={getPreference('points_visualization_mode', 'classic')}
            onValueChange={handleVisualizationModeChange}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="classic" id="classic" />
              <Label htmlFor="classic" className="flex-1 cursor-pointer">
                <div className="font-medium">Mode classique</div>
                <div className="text-sm text-muted-foreground">
                  Affichage numérique des points (ex: 42 pts)
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="cookies" id="cookies" />
              <Label htmlFor="cookies" className="flex-1 cursor-pointer">
                <div className="font-medium flex items-center gap-2">
                  Mode cookies <Cookie className="h-4 w-4" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Visualisation ludique avec des cookies (1 🍪 = 1 point)
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};
