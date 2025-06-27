
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useTeamManagement = (projectId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupération des informations du projet
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
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

  // Récupération des membres du projet
  const { data: members } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          id,
          role,
          project_id,
          profiles (
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
      
      // Amélioration de la transformation des données avec vérifications
      const transformedMembers = data.map(member => {
        console.log("Transforming member:", member); // Log de débogage
        
        if (!member.id) {
          console.error("Member without ID found:", member);
        }
        
        return {
          id: member.id, // S'assurer que l'ID est préservé
          role: member.role,
          project_id: member.project_id,
          profiles: {
            ...member.profiles,
            roles: Array.isArray(member.profiles?.user_roles) 
              ? member.profiles.user_roles.map((ur: any) => ur.role) 
              : []
          }
        };
      });
      
      console.log("Transformed members:", transformedMembers); // Log de débogage
      return transformedMembers;
    },
  });

  // Mutation pour supprimer un membre
  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Vérification renforcée que l'ID est valide
      if (!memberId || memberId === 'undefined' || memberId === 'null') {
        throw new Error("ID du membre non défini ou invalide");
      }
      
      console.log("Deleting member with ID:", memberId); // Log de débogage
      
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
      // Vérification renforcée que l'ID est valide
      if (!memberId || memberId === 'undefined' || memberId === 'null') {
        throw new Error("ID du membre non défini ou invalide");
      }
      
      console.log(`Updating member ${memberId} in project ${projectId} to role ${role}`); // Log de débogage
      
      // Vérifier d'abord si l'enregistrement existe
      const { data: checkData, error: checkError } = await supabase
        .from("project_members")
        .select("*")
        .eq("id", memberId)
        .eq("project_id", projectId)
        .single();
      
      console.log("Check result:", checkData, checkError); // Log de débogage
      
      if (checkError) {
        console.error("Error checking member existence:", checkError);
        throw checkError;
      }
      
      if (!checkData) {
        throw new Error(`No project member found with ID ${memberId} in project ${projectId}`);
      }
      
      const { data, error } = await supabase
        .from("project_members")
        .update({ role })
        .eq("id", memberId)
        .eq("project_id", projectId)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Update response:", data); // Log de débogage
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

  // Fonction pour supprimer un membre avec vérifications renforcées
  const handleDelete = (memberId: string, email?: string) => {
    // Vérification que l'ID est valide
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Invalid member ID for deletion:", memberId);
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

  // Fonction pour promouvoir un membre en chef de projet secondaire avec vérifications renforcées
  const handlePromoteToSecondaryManager = (memberId: string, roles: string[], isAdmin: boolean) => {
    // Vérification que l'ID est valide
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Invalid member ID for promotion:", memberId);
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

  // Fonction pour rétrograder un chef de projet secondaire en membre avec vérifications renforcées
  const handleDemoteToMember = (memberId: string) => {
    // Vérification que l'ID est valide
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Invalid member ID for demotion:", memberId);
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
