/**
 * @component RatingPromptSettingsCard
 * @description Carte d'administration pour configurer la relance d'évaluation :
 * - délai initial après création du compte avant la 1ère relance,
 * - fréquence entre 2 relances.
 * Persiste dans `application_settings` (type 'rating').
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const DEFAULTS = { initial: 7, frequency: 30 };

export const RatingPromptSettingsCard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [initial, setInitial] = useState<number>(DEFAULTS.initial);
  const [frequency, setFrequency] = useState<number>(DEFAULTS.frequency);

  const { data, isLoading } = useQuery({
    queryKey: ["ratingPromptSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_settings")
        .select("key, value")
        .eq("type", "rating");
      if (error) throw error;
      const map = new Map<string, string>();
      (data || []).forEach((row) => map.set(row.key, row.value));
      return {
        initial: parseInt(map.get("rating_prompt_initial_delay_days") ?? `${DEFAULTS.initial}`, 10),
        frequency: parseInt(map.get("rating_prompt_frequency_days") ?? `${DEFAULTS.frequency}`, 10),
      };
    },
  });

  useEffect(() => {
    if (data) {
      setInitial(data.initial);
      setFrequency(data.frequency);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = [
        { type: "rating" as const, key: "rating_prompt_initial_delay_days", value: String(initial) },
        { type: "rating" as const, key: "rating_prompt_frequency_days", value: String(frequency) },
      ];
      for (const row of rows) {
        const { error } = await supabase
          .from("application_settings")
          .upsert(row, { onConflict: "type,key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratingPromptSettings"] });
      toast({ title: "Paramètres enregistrés", description: "La configuration des relances a été mise à jour." });
    },
    onError: (e: Error) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Relance d'évaluation
        </CardTitle>
        <CardDescription>
          Configurez la fréquence à laquelle les utilisateurs qui n'ont pas encore évalué l'application
          se voient proposer de le faire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="initial-delay">Délai initial (jours)</Label>
            <Input
              id="initial-delay"
              type="number"
              min={0}
              value={initial}
              onChange={(e) => setInitial(Math.max(0, parseInt(e.target.value || "0", 10)))}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Délai après la création du compte avant la première proposition.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence des relances (jours)</Label>
            <Input
              id="frequency"
              type="number"
              min={1}
              value={frequency}
              onChange={(e) => setFrequency(Math.max(1, parseInt(e.target.value || "1", 10)))}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Temps d'attente après un report avant de proposer à nouveau.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {save.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
