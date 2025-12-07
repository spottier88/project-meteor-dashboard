import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useActivityPointsQuota } from "@/hooks/useActivityPointsQuota";

/**
 * Schéma de validation pour les paramètres de points d'activité
 */
const activityPointsSchema = z.object({
  weeklyPointsQuota: z
    .number()
    .min(1, "Le quota doit être au minimum de 1 point")
    .max(100, "Le quota ne peut pas dépasser 100 points"),
});

type ActivityPointsFormValues = z.infer<typeof activityPointsSchema>;

/**
 * Composant de configuration du quota de points hebdomadaire pour les activités
 * Permet aux administrateurs de définir le nombre de points que chaque utilisateur
 * doit distribuer par semaine sur ses projets.
 */
export const ActivityPointsSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { quota, isLoading } = useActivityPointsQuota();

  const form = useForm<ActivityPointsFormValues>({
    resolver: zodResolver(activityPointsSchema),
    defaultValues: {
      weeklyPointsQuota: quota,
    },
    values: {
      weeklyPointsQuota: quota,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ActivityPointsFormValues) => {
      // Supprimer le paramètre existant
      const { error: deleteError } = await supabase
        .from("application_settings")
        .delete()
        .eq("type", "activity")
        .eq("key", "weekly_points_quota");

      if (deleteError) throw deleteError;

      // Insérer le nouveau paramètre
      const { error: insertError } = await supabase
        .from("application_settings")
        .insert([
          {
            type: "activity",
            key: "weekly_points_quota",
            value: values.weeklyPointsQuota.toString(),
          },
        ]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast({
        title: "Paramètres sauvegardés",
        description: "Le quota de points hebdomadaire a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["activityPointsQuota"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde des paramètres.",
        variant: "destructive",
      });
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
    },
  });

  if (isLoading) {
    return <div className="container py-6">Chargement des paramètres...</div>;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin">
              <ChevronLeft className="h-4 w-4" />
              Retour à l'administration
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Paramètres des activités
          </h1>
        </div>
      </div>

      <div className="border rounded-md p-6 bg-card">
        <div className="mb-6">
          <h3 className="text-lg font-medium">Quota de points hebdomadaire</h3>
          <p className="text-sm text-muted-foreground">
            Définissez le nombre de points que chaque utilisateur doit distribuer
            chaque semaine sur ses projets.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="weeklyPointsQuota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points par semaine</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormDescription>
                    Chaque utilisateur devra distribuer ce nombre de points sur ses
                    projets chaque semaine. Recommandation : entre 5 et 20 points.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={mutation.status === "pending"}>
                {mutation.status === "pending"
                  ? "Sauvegarde en cours..."
                  : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
