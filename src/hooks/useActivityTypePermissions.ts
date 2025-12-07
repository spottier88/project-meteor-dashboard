
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityTypePermission, HierarchyEntity } from "@/types/activity";
import { useToast } from "@/hooks/use-toast";

export const useActivityTypePermissions = (activityTypeCode?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les permissions pour un type d'activité spécifique
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["activity-type-permissions", activityTypeCode],
    queryFn: async () => {
      if (!activityTypeCode) return [];

      const { data, error } = await supabase
        .from("activity_type_permissions")
        .select("*")
        .eq("activity_type_code", activityTypeCode);

      if (error) throw error;
      return data as ActivityTypePermission[];
    },
    enabled: !!activityTypeCode,
  });

  // Récupérer toutes les entités hiérarchiques
  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data as HierarchyEntity[];
    },
  });

  const { data: directions } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, name, pole_id")
        .order("name");

      if (error) throw error;
      return data as (HierarchyEntity & { pole_id: string })[];
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, direction_id")
        .order("name");

      if (error) throw error;
      return data as (HierarchyEntity & { direction_id: string })[];
    },
  });

  // Ajouter une permission
  const addPermissionMutation = useMutation({
    mutationFn: async (permission: Omit<ActivityTypePermission, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("activity_type_permissions")
        .insert(permission)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-type-permissions", activityTypeCode] });
      toast({
        title: "Permission ajoutée",
        description: "La permission a été ajoutée avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de l'ajout de la permission:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la permission",
        variant: "destructive",
      });
    },
  });

  // Supprimer une permission
  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from("activity_type_permissions")
        .delete()
        .eq("id", permissionId);

      if (error) throw error;
      return permissionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-type-permissions", activityTypeCode] });
      toast({
        title: "Permission supprimée",
        description: "La permission a été supprimée avec succès",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression de la permission:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la permission",
        variant: "destructive",
      });
    },
  });

  // Mettre à jour les permissions par lots
  const updatePermissionsBatchMutation = useMutation({
    mutationFn: async ({
      activityTypeCode,
      entitiesToAdd,
      entitiesToRemove,
    }: {
      activityTypeCode: string;
      entitiesToAdd: { entity_type: 'pole' | 'direction' | 'service'; entity_id: string }[];
      entitiesToRemove: string[];
    }) => {
      // Supprimer les permissions à enlever
      if (entitiesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("activity_type_permissions")
          .delete()
          .in("id", entitiesToRemove);

        if (deleteError) throw deleteError;
      }

      // Ajouter les nouvelles permissions
      if (entitiesToAdd.length > 0) {
        const newPermissions = entitiesToAdd.map(entity => ({
          activity_type_code: activityTypeCode,
          entity_type: entity.entity_type,
          entity_id: entity.entity_id,
        }));

        const { error: insertError } = await supabase
          .from("activity_type_permissions")
          .insert(newPermissions);

        if (insertError) throw insertError;
      }

      return { added: entitiesToAdd.length, removed: entitiesToRemove.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["activity-type-permissions", activityTypeCode] });
      toast({
        title: "Permissions mises à jour",
        description: `${result.added} ajoutées, ${result.removed} supprimées`,
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour des permissions:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les permissions",
        variant: "destructive",
      });
    },
  });

  // Vérifier si une entité a déjà une permission
  const hasPermission = (entityType: string, entityId: string) => {
    if (!permissions) return false;
    return permissions.some(
      p => p.entity_type === entityType && p.entity_id === entityId
    );
  };

  // Grouper les services par direction
  const servicesByDirection = services?.reduce((acc, service) => {
    if (!acc[service.direction_id]) {
      acc[service.direction_id] = [];
    }
    acc[service.direction_id].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  // Grouper les directions par pôle
  const directionsByPole = directions?.reduce((acc, direction) => {
    if (!acc[direction.pole_id]) {
      acc[direction.pole_id] = [];
    }
    acc[direction.pole_id].push(direction);
    return acc;
  }, {} as Record<string, typeof directions>);

  return {
    permissions,
    isLoading,
    poles,
    directions,
    services,
    directionsByPole,
    servicesByDirection,
    addPermission: addPermissionMutation.mutate,
    deletePermission: deletePermissionMutation.mutate,
    updatePermissionsBatch: updatePermissionsBatchMutation.mutate,
    isUpdating: addPermissionMutation.isPending || 
               deletePermissionMutation.isPending || 
               updatePermissionsBatchMutation.isPending,
    hasPermission,
  };
};
