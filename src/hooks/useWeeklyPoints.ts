import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityPoint } from "@/types/activity";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, format } from "date-fns";

/**
 * Hook pour gérer les points d'activité hebdomadaires
 * @param userId - ID de l'utilisateur
 * @param weekStartDate - Date de début de semaine (lundi)
 */
export const useWeeklyPoints = (userId: string, weekStartDate: Date) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const weekStart = format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Récupérer les points de la semaine (hebdomadaires et quotidiens)
  const { data: points, isLoading, error } = useQuery({
    queryKey: ["weeklyPoints", userId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_points")
        .select(`
          *,
          projects (
            id,
            title
          )
        `)
        .eq("user_id", userId)
        .eq("week_start_date", weekStart)
        .order("activity_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrichir avec les types d'activités si nécessaire
      const enrichedData = await Promise.all(
        (data || []).map(async (point) => {
          if (point.activity_type) {
            const { data: activityTypeData } = await supabase
              .from("activity_types")
              .select("code, label, color")
              .eq("code", point.activity_type)
              .single();
            
            return {
              ...point,
              activity_types: activityTypeData,
            };
          }
          return point;
        })
      );

      return enrichedData as any[];
    },
    enabled: !!userId,
  });

  // Calculer le total des points utilisés
  const totalPointsUsed = points?.reduce((sum, point) => sum + point.points, 0) || 0;

  // Mutation pour ajouter des points
  const addPointsMutation = useMutation({
    mutationFn: async (newPoint: Omit<ActivityPoint, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("activity_points")
        .insert([{ ...newPoint, week_start_date: weekStart }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyPoints", userId, weekStart] });
      toast({
        title: "Points ajoutés",
        description: "Vos points ont été enregistrés avec succès.",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout des points:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les points.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour ajouter des points en masse
  const addBulkPointsMutation = useMutation({
    mutationFn: async (newPoints: Omit<ActivityPoint, "id" | "created_at" | "updated_at">[]) => {
      const pointsToInsert = newPoints.map(point => ({
        ...point,
        week_start_date: weekStart
      }));

      const { data, error } = await supabase
        .from("activity_points")
        .insert(pointsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyPoints", userId, weekStart] });
      toast({
        title: "Points ajoutés",
        description: "Vos points ont été enregistrés avec succès.",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout des points:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les points.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour des points
  const updatePointsMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ActivityPoint> }) => {
      const { data, error } = await supabase
        .from("activity_points")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyPoints", userId, weekStart] });
      toast({
        title: "Points mis à jour",
        description: "Vos modifications ont été enregistrées.",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour des points:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les points.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer des points
  const deletePointsMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("activity_points")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyPoints", userId, weekStart] });
      toast({
        title: "Points supprimés",
        description: "Les points ont été supprimés avec succès.",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression des points:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les points.",
        variant: "destructive",
      });
    },
  });

  return {
    points: points || [],
    totalPointsUsed,
    isLoading,
    error,
    addPoints: addPointsMutation.mutate,
    addBulkPoints: addBulkPointsMutation.mutateAsync,
    updatePoints: updatePointsMutation.mutate,
    deletePoints: deletePointsMutation.mutate,
    isAddingPoints: addPointsMutation.status === "pending",
    isUpdatingPoints: updatePointsMutation.status === "pending",
    isDeletingPoints: deletePointsMutation.status === "pending",
  };
};

/**
 * Hook pour récupérer le total des points utilisés sur une semaine
 * Utilise la fonction PostgreSQL pour un calcul optimisé
 */
export const useWeeklyPointsTotal = (userId: string, weekStartDate: Date) => {
  const weekStart = format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["weeklyPointsTotal", userId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_weekly_points_total", {
        p_user_id: userId,
        p_week_start: weekStart,
      });

      if (error) throw error;
      return data as number;
    },
    enabled: !!userId,
  });
};
