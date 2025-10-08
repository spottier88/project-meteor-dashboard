import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { useActivityPointsQuota } from "@/hooks/useActivityPointsQuota";

/**
 * Schéma de validation pour l'ajout de points
 */
const pointsEntrySchema = z.object({
  project_id: z.string().optional(),
  activity_type: z.string().optional(),
  points: z.number().min(1, "Au moins 1 point est requis").max(100, "Maximum 100 points"),
  description: z.string().optional(),
});

type PointsEntryFormValues = z.infer<typeof pointsEntrySchema>;

interface PointsEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PointsEntryFormValues) => void;
  isSubmitting: boolean;
  pointsRemaining: number;
}

/**
 * Formulaire modal pour saisir des points sur un projet
 */
export const PointsEntryForm: React.FC<PointsEntryFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  pointsRemaining,
}) => {
  const session = useSession();
  const { quota } = useActivityPointsQuota();

  // Récupérer les projets accessibles
  const { data: projects } = useQuery({
    queryKey: ["accessibleProjects", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .order("title");

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id && open,
  });

  // Récupérer les types d'activités
  const { data: activityTypes } = useQuery({
    queryKey: ["activityTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("code, label, color")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const form = useForm<PointsEntryFormValues>({
    resolver: zodResolver(pointsEntrySchema),
    defaultValues: {
      points: 1,
      description: "",
    },
  });

  const handleSubmit = (values: PointsEntryFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter des points</DialogTitle>
          <DialogDescription>
            Distribuez vos points sur un projet. Quota : {quota} points/semaine
            {pointsRemaining > 0 && ` (${pointsRemaining} restants)`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Sélection du projet (optionnel) */}
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projet (optionnel)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Facultatif : associez ces points à un projet spécifique
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sélection du type d'activité (optionnel) */}
            <FormField
              control={form.control}
              name="activity_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'activité (optionnel)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activityTypes?.map((type) => (
                        <SelectItem key={type.code} value={type.code}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Facultatif : précisez le type d'activité
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre de points */}
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de points *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={Math.min(100, pointsRemaining)}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormDescription>
                    Entre 1 et {Math.min(100, pointsRemaining)} points
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description optionnelle */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes ou commentaires..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || pointsRemaining <= 0}>
                {isSubmitting ? "Enregistrement..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
