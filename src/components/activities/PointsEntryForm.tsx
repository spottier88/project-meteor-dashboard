import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import { PointsCookieSlider } from "./PointsCookieSlider";
import { useUserPreferences } from "@/hooks/useUserPreferences";

/**
 * Schéma de validation pour l'ajout de points
 * La limite dépend du mode : 2 points en quotidien, 10 en hebdomadaire
 */
const createPointsEntrySchema = (maxPoints: number) => z.object({
  project_id: z.string().optional(),
  activity_type: z.string().optional(),
  points: z.number().min(1, "Au moins 1 point est requis").max(maxPoints, `Maximum ${maxPoints} points`),
  description: z.string().optional(),
});

type PointsEntryFormValues = {
  project_id?: string;
  activity_type?: string;
  points: number;
  description?: string;
};

interface PointsEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PointsEntryFormValues) => void;
  isSubmitting: boolean;
  pointsRemaining: number;
  selectedDate?: Date | null;
  mode?: 'weekly' | 'daily';
  dailyPointsUsed?: number; // Points déjà saisis pour ce jour
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
  selectedDate = null,
  mode = 'weekly',
  dailyPointsUsed = 0,
}) => {
  const session = useSession();
  const { quota } = useActivityPointsQuota();
  const { getPreference } = useUserPreferences();
  const useCookieMode = getPreference('points_visualization_mode', 'classic') === 'cookies';

  // Calculer la limite de points selon le mode
  const dailyQuota = 2; // Limite quotidienne
  const weeklyQuota = 10; // Limite hebdomadaire
  const maxPointsForMode = mode === 'daily' ? dailyQuota : weeklyQuota;
  
  // Calculer combien de points peuvent encore être saisis
  const maxPointsAvailable = mode === 'daily' 
    ? Math.min(maxPointsForMode - dailyPointsUsed, pointsRemaining)
    : Math.min(maxPointsForMode, pointsRemaining);

  const pointsEntrySchema = createPointsEntrySchema(maxPointsAvailable);

  // Récupérer les projets accessibles via la fonction RPC
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["accessibleProjectsForPoints", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .rpc("get_accessible_projects_list_view_with_admin_mode", {
          p_user_id: session.user.id,
          p_admin_mode_disabled: false,
        });

      if (error) throw error;
      
      // Extraire seulement l'id et le titre pour le select
      const projectsData = (data || []) as any[];
      return projectsData.map((project: any) => ({
        id: project.id,
        title: project.title,
      }));
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

  // Réinitialiser le formulaire quand le mode change ou quand on ouvre
  React.useEffect(() => {
    if (open) {
      form.reset({
        points: 1,
        description: "",
        project_id: undefined,
        activity_type: undefined,
      });
    }
  }, [open, mode, form]);

  const handleSubmit = (values: PointsEntryFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'daily' && selectedDate
              ? `Ajouter des points - ${format(selectedDate, 'dd MMMM yyyy', { locale: fr })}`
              : 'Ajouter des points'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'daily' 
              ? `Les points seront ajoutés pour le jour sélectionné. Limite : ${dailyQuota} pts/jour${dailyPointsUsed > 0 ? ` (${dailyPointsUsed} déjà saisis)` : ''}`
              : `Distribuez vos points sur un projet. Quota : ${quota} points/semaine`}
            {pointsRemaining > 0 && ` - ${pointsRemaining} pts restants cette semaine`}
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
                        <SelectValue placeholder={
                          isLoadingProjects 
                            ? "Chargement des projets..." 
                            : "Sélectionner un projet"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {isLoadingProjects ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Chargement...
                        </div>
                      ) : projects && projects.length > 0 ? (
                        projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Aucun projet disponible
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Facultatif : associez ces points à un projet spécifique
                    {projects && ` (${projects.length} projet${projects.length > 1 ? 's' : ''} disponible${projects.length > 1 ? 's' : ''})`}
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
                  {useCookieMode ? (
                    <PointsCookieSlider
                      value={field.value || 1}
                      onChange={field.onChange}
                      label="Nombre de points *"
                      min={1}
                      max={maxPointsAvailable}
                    />
                  ) : (
                    <>
                      <FormLabel>Nombre de points *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={maxPointsAvailable}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormDescription>
                        {mode === 'daily' 
                          ? `Entre 1 et ${maxPointsAvailable} points (max ${dailyQuota} pts/jour)`
                          : `Entre 1 et ${maxPointsAvailable} points`}
                      </FormDescription>
                    </>
                  )}
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
              <Button type="submit" disabled={isSubmitting || maxPointsAvailable <= 0}>
                {isSubmitting ? "Enregistrement..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
