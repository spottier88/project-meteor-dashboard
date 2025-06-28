import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useTeamManagement = (projectId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
  });

  // Récupération des membres du projet avec des alias clairs
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

      if (error) throw error;
      
      // Transformation des données avec validation de l'ID
      const transformedData = data
        .filter(member => {
          // Filtrer les membres sans ID valide
          if (!member.id) {
            console.warn("Membre sans ID project_members trouvé:", member);
            return false;
          }
          return true;
        })
        .map(member => {
          // S'assurer que l'ID du project_member est bien présent
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

          // Log pour vérifier que l'ID est bien présent
          console.log("Membre transformé avec ID:", {
            project_member_id: memberData.id,
            user_id: memberData.user_id,
            email: memberData.profiles?.email
          });

          return memberData;
        });

      console.log("Données finales transformées:", transformedData);
      return transformedData;
    },
  });

  // Mutation pour supprimer un membre
  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Vérification préalable que l'ID est valide
      if (!memberId || memberId === 'undefined' || memberId === 'null') {
        console.error("ID du membre invalide pour suppression:", memberId);
        throw new Error("ID du membre non défini");
      }
      
      console.log("Suppression du membre avec ID:", memberId);
      
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
      console.error("Error deleting member:", error);
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
      if (!memberId || memberId === 'undefined' || memberId === 'null') {
        console.error("ID du membre invalide pour mise à jour:", memberId);
        throw new Error("ID du membre non défini");
      }
      
      if (!role) {
        console.error("Rôle non défini pour la mise à jour");
        throw new Error("Rôle non défini");
      }
      
      console.log(`Mise à jour du membre ${memberId} vers le rôle ${role}`);
      
      // Vérifier d'abord si l'enregistrement existe
      const { data: checkData, error: checkError } = await supabase
        .from("project_members")
        .select("*")
        .eq("id", memberId)
        .eq("project_id", projectId)
        .single();
      
      if (checkError) {
        console.error("Erreur lors de la vérification de l'existence du membre:", checkError);
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
        console.error("Erreur Supabase lors de la mise à jour:", error);
        throw error;
      }
      
      console.log("Réponse de la mise à jour:", data);
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
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du rôle.",
      });
    },
  });

  // Fonction pour supprimer un membre
  const handleDelete = (memberId: string, email?: string) => {
    // Vérification que l'ID est valide
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Tentative de suppression avec ID invalide:", memberId);
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
    // Vérification de l'ID avant traitement
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Tentative de promotion avec ID invalide:", memberId);
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
    // Vérification de l'ID avant traitement
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Tentative de rétrogradation avec ID invalide:", memberId);
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
