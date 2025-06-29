
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

export const useTeamManagement = (projectId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // S'assurer que les permissions sont chargées avant de charger les membres
  const permissions = useProjectPermissions(projectId);

  console.log("🔍 useTeamManagement - Permissions reçues:", {
    projectId,
    permissions,
    component: "useTeamManagement"
  });

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

  // Récupération des membres du projet avec des alias clairs
  // IMPORTANT: Ne charger les membres que si les permissions sont disponibles
  const { data: members } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      console.log("🔍 useTeamManagement - Début de la récupération des membres pour le projet:", projectId);
      
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
        console.error("❌ useTeamManagement - Erreur lors de la récupération des membres:", error);
        throw error;
      }
      
      console.log("📊 useTeamManagement - Données brutes reçues:", data);
      
      // Transformation des données avec validation renforcée de l'ID
      const transformedData = data
        .filter(member => {
          // Filtrer les membres sans ID valide de manière plus stricte
          const hasValidId = member.id && 
                            member.id !== 'undefined' && 
                            member.id !== 'null' && 
                            typeof member.id === 'string' &&
                            member.id.length > 0;
          
          if (!hasValidId) {
            console.warn("⚠️ useTeamManagement - Membre avec ID invalide filtré:", {
              member,
              id: member.id,
              type: typeof member.id
            });
            return false;
          }
          return true;
        })
        .map(member => {
          // S'assurer que l'ID du project_member est bien présent et valide
          const memberData = {
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
          };

          // Log détaillé pour vérifier que l'ID est bien présent
          console.log("✅ useTeamManagement - Membre transformé avec validation:", {
            project_member_id: memberData.id,
            user_id: memberData.user_id,
            email: memberData.profiles?.email,
            hasValidId: !!memberData.id && 
                       memberData.id !== 'undefined' && 
                       memberData.id !== 'null' &&
                       typeof memberData.id === 'string' &&
                       memberData.id.length > 0,
            idType: typeof memberData.id,
            idLength: memberData.id?.length || 0
          });

          return memberData;
        });

      console.log("🎯 useTeamManagement - Données finales transformées:", transformedData);
      console.log("📈 useTeamManagement - Nombre de membres valides:", transformedData.length);
      
      return transformedData;
    },
    // CRITIQUE: Ne charger les membres que si les permissions sont disponibles
    enabled: !!projectId && !!permissions && (permissions.canManageTeam || permissions.canEdit || permissions.isAdmin),
    staleTime: 300000, // 5 minutes - cohérent avec les autres requêtes
  });

  // Mutation pour supprimer un membre
  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Vérification préalable renforcée que l'ID est valide
      if (!memberId || 
          memberId === 'undefined' || 
          memberId === 'null' ||
          typeof memberId !== 'string' ||
          memberId.length === 0) {
        console.error("❌ useTeamManagement - ID du membre invalide pour suppression:", {
          memberId,
          type: typeof memberId,
          length: memberId?.length || 0
        });
        throw new Error("ID du membre non défini ou invalide");
      }
      
      console.log("🗑️ useTeamManagement - Suppression du membre avec ID:", memberId);
      
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
      console.error("❌ useTeamManagement - Erreur lors de la suppression:", error);
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
      // Vérifications préalables renforcées
      if (!memberId || 
          memberId === 'undefined' || 
          memberId === 'null' ||
          typeof memberId !== 'string' ||
          memberId.length === 0) {
        console.error("❌ useTeamManagement - ID du membre invalide pour mise à jour:", {
          memberId,
          type: typeof memberId,
          length: memberId?.length || 0
        });
        throw new Error("ID du membre non défini ou invalide");
      }
      
      if (!role || typeof role !== 'string') {
        console.error("❌ useTeamManagement - Rôle invalide pour la mise à jour:", role);
        throw new Error("Rôle non défini ou invalide");
      }
      
      console.log(`🔄 useTeamManagement - Mise à jour du membre ${memberId} vers le rôle ${role}`);
      
      // Vérifier d'abord si l'enregistrement existe
      const { data: checkData, error: checkError } = await supabase
        .from("project_members")
        .select("*")
        .eq("id", memberId)
        .eq("project_id", projectId)
        .single();
      
      if (checkError) {
        console.error("❌ useTeamManagement - Erreur lors de la vérification de l'existence du membre:", checkError);
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
        console.error("❌ useTeamManagement - Erreur Supabase lors de la mise à jour:", error);
        throw error;
      }
      
      console.log("✅ useTeamManagement - Réponse de la mise à jour:", data);
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
      console.error("❌ useTeamManagement - Erreur lors de la mise à jour du rôle:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du rôle.",
      });
    },
  });

  // Fonction pour supprimer un membre avec validation renforcée
  const handleDelete = (memberId: string, email?: string) => {
    // Vérification renforcée que l'ID est valide
    if (!memberId || 
        memberId === 'undefined' || 
        memberId === 'null' ||
        typeof memberId !== 'string' ||
        memberId.length === 0) {
      console.error("❌ useTeamManagement - Tentative de suppression avec ID invalide:", {
        memberId,
        type: typeof memberId,
        length: memberId?.length || 0
      });
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

  // Fonction pour promouvoir un membre en chef de projet secondaire avec validation renforcée
  const handlePromoteToSecondaryManager = (memberId: string, roles: string[], isAdmin: boolean) => {
    // Vérification renforcée de l'ID avant traitement
    if (!memberId || 
        memberId === 'undefined' || 
        memberId === 'null' ||
        typeof memberId !== 'string' ||
        memberId.length === 0) {
      console.error("❌ useTeamManagement - Tentative de promotion avec ID invalide:", {
        memberId,
        type: typeof memberId,
        length: memberId?.length || 0
      });
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

  // Fonction pour rétrograder un chef de projet secondaire en membre avec validation renforcée
  const handleDemoteToMember = (memberId: string) => {
    // Vérification renforcée de l'ID avant traitement
    if (!memberId || 
        memberId === 'undefined' || 
        memberId === 'null' ||
        typeof memberId !== 'string' ||
        memberId.length === 0) {
      console.error("❌ useTeamManagement - Tentative de rétrogradation avec ID invalide:", {
        memberId,
        type: typeof memberId,
        length: memberId?.length || 0
      });
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
