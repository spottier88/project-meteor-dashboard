
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

export const useTeamManagement = (projectId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Charger les permissions une seule fois
  const permissions = useProjectPermissions(projectId);

  // Récupération des informations du projet
  const { data: project } = useQuery({
    queryKey: ["teamProjectManager", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 300000, // 5 minutes
    enabled: !!projectId,
  });

  // Récupération des membres du projet avec une logique simplifiée
  const { data: members } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          id,
          role,
          project_id,
          user_id,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name,
            user_roles (
              role
            )
          )
        `)
        .eq("project_id", projectId);

      if (error) {
        throw error;
      }
      
      // Transformation des données avec validation stricte de l'ID
      const transformedData = data
        .filter(member => {
          // Filtrer les membres sans ID valide
          const hasValidId = member.id && 
                            typeof member.id === 'string' &&
                            member.id.length > 0 &&
                            member.id !== 'undefined' && 
                            member.id !== 'null';
          
          return hasValidId;
        })
        .map(member => ({
          id: member.id, // ID du project_member (crucial pour les mutations)
          user_id: member.user_id,
          role: member.role,
          project_id: member.project_id,
          profiles: member.profiles ? {
            id: member.profiles.id,
            email: member.profiles.email,
            first_name: member.profiles.first_name,
            last_name: member.profiles.last_name,
            roles: Array.isArray(member.profiles.user_roles) 
              ? member.profiles.user_roles.map((ur: any) => ur.role) 
              : []
          } : null
        }));

      return transformedData;
    },
    // Charger seulement si les permissions le permettent
    enabled: !!projectId && !!permissions && (permissions.canManageTeam || permissions.canEdit || permissions.isAdmin),
    staleTime: 300000, // 5 minutes
  });

  // Mutation pour supprimer un membre
  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Vérification stricte de l'ID
      if (!memberId || 
          typeof memberId !== 'string' ||
          memberId.length === 0 ||
          memberId === 'undefined' || 
          memberId === 'null') {
        throw new Error("ID du membre non défini ou invalide");
      }
      
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      toast({
        title: "Membre supprimé",
        description: "Le membre a été retiré de l'équipe avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du membre.",
      });
    },
  });

  // Mutation pour mettre à jour le rôle d'un membre
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string, role: string }) => {
      // Vérifications strictes
      if (!memberId || 
          typeof memberId !== 'string' ||
          memberId.length === 0 ||
          memberId === 'undefined' || 
          memberId === 'null') {
        throw new Error("ID du membre non défini ou invalide");
      }
      
      if (!role || typeof role !== 'string') {
        throw new Error("Rôle non défini ou invalide");
      }
      
      // Vérifier d'abord si l'enregistrement existe
      const { data: checkData, error: checkError } = await supabase
        .from("project_members")
        .select("*")
        .eq("id", memberId)
        .eq("project_id", projectId)
        .single();
      
      if (checkError) {
        throw checkError;
      }
      
      if (!checkData) {
        throw new Error(`Aucun membre trouvé avec l'ID ${memberId} dans le projet ${projectId}`);
      }
      
      // Effectuer la mise à jour
      const { data, error } = await supabase
        .from("project_members")
        .update({ role })
        .eq("id", memberId)
        .eq("project_id", projectId)
        .select();

      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      toast({
        title: "Rôle mis à jour",
        description: "Le rôle du membre a été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du rôle.",
      });
    },
  });

  // Fonction pour supprimer un membre avec validation stricte
  const handleDelete = (memberId: string, email?: string) => {
    // Vérification stricte de l'ID
    if (!memberId || 
        typeof memberId !== 'string' ||
        memberId.length === 0 ||
        memberId === 'undefined' || 
        memberId === 'null') {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer ce membre : identifiant invalide.",
      });
      return;
    }

    if (email && project?.project_manager === email) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: "Vous ne pouvez pas retirer le chef de projet de l'équipe.",
      });
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?")) {
      deleteMutation.mutate(memberId);
    }
  };

  // Fonction pour promouvoir un membre en chef de projet secondaire
  const handlePromoteToSecondaryManager = (memberId: string, roles: string[], isAdmin: boolean) => {
    // Vérification stricte de l'ID
    if (!memberId || 
        typeof memberId !== 'string' ||
        memberId.length === 0 ||
        memberId === 'undefined' || 
        memberId === 'null') {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de promouvoir ce membre : identifiant invalide.",
      });
      return;
    }

    // Pour les admins, on supprime la vérification des rôles
    if (isAdmin) {
      updateRoleMutation.mutate({ memberId, role: 'secondary_manager' });
      return;
    }
    
    // Pour les non-admins, on garde la vérification existante
    if (!roles.includes('chef_projet')) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: "Seuls les utilisateurs ayant le rôle 'Chef de projet' peuvent être promus.",
      });
      return;
    }

    updateRoleMutation.mutate({ memberId, role: 'secondary_manager' });
  };

  // Fonction pour rétrograder un chef de projet secondaire en membre
  const handleDemoteToMember = (memberId: string) => {
    // Vérification stricte de l'ID
    if (!memberId || 
        typeof memberId !== 'string' ||
        memberId.length === 0 ||
        memberId === 'undefined' || 
        memberId === 'null') {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de rétrograder ce membre : identifiant invalide.",
      });
      return;
    }

    updateRoleMutation.mutate({ memberId, role: 'member' });
  };

  return {
    project,
    members,
    handleDelete,
    handlePromoteToSecondaryManager,
    handleDemoteToMember
  };
};
