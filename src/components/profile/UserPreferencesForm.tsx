/**
 * @component UserPreferencesForm
 * @description Formulaire de configuration des préférences utilisateur.
 * Permet de configurer les options comme l'ouverture des projets dans un nouvel onglet,
 * les notifications email et la fréquence de réception.
 */

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Loader2, Cookie, BookOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Options de fréquence de réception des emails (en heures)
const FREQUENCY_OPTIONS = [
  { value: "1", label: "Toutes les heures" },
  { value: "4", label: "Toutes les 4 heures" },
  { value: "12", label: "Toutes les 12 heures" },
  { value: "24", label: "Une fois par jour" },
  { value: "168", label: "Une fois par semaine" },
];

export const UserPreferencesForm = () => {
  const { preferences, isLoading, updatePreferences, getPreference } = useUserPreferences();
  const { toast } = useToast();

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

  const handleToggleEmailNotifications = (checked: boolean) => {
    updatePreferences({ email_notifications_enabled: checked });
  };

  const handleFrequencyChange = (value: string) => {
    updatePreferences({ email_digest_frequency: parseInt(value, 10) });
  };

  const handleResetOnboarding = () => {
    updatePreferences({ 
      has_seen_onboarding: false,
      onboarding_seen_at: null
    });
    toast({
      title: "Tutoriel réinitialisé",
      description: "Le tutoriel de prise en main s'affichera à votre prochaine visite du tableau de bord.",
    });
  };

  const emailNotificationsEnabled = getPreference('email_notifications_enabled', true);
  const emailDigestFrequency = getPreference('email_digest_frequency', 24);

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
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

      {/* Section Notifications Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifications par email
          </CardTitle>
          <CardDescription>
            Configurez la réception des notifications par email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activation/désactivation des notifications */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="email-notifications">Recevoir les notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevez un résumé des notifications importantes directement dans votre boîte mail
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotificationsEnabled ?? true}
              onCheckedChange={handleToggleEmailNotifications}
            />
          </div>

          {/* Fréquence de réception */}
          {emailNotificationsEnabled !== false && (
            <div className="space-y-2">
              <Label htmlFor="email-frequency">Fréquence de réception</Label>
              <Select
                value={String(emailDigestFrequency ?? 24)}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger id="email-frequency" className="w-full">
                  <SelectValue placeholder="Choisir une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Définissez la fréquence à laquelle vous souhaitez recevoir les récapitulatifs de notifications
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Affichage des points */}
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

      {/* Section Aide et tutoriel */}
      <Card>
        <CardHeader>
          <CardTitle>Aide et tutoriel</CardTitle>
          <CardDescription>
            Révisez le tutoriel de prise en main de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={handleResetOnboarding}
            className="w-full"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Revoir le tutoriel de prise en main
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Le tutoriel s'affichera automatiquement lors de votre prochaine visite du tableau de bord.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
