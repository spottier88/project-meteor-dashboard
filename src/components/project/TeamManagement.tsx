import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, UserMinus } from "lucide-react";
import { useUser } from "@supabase/auth-helpers-react";

interface TeamManagementProps {
  projectId: string;
}

export const TeamManagement = ({ projectId }: TeamManagementProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const user = useUser();

  // Récupérer les informations du projet
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project:", error);
        throw error;
      }
      return data;
    },
  });

  // Récupérer le profil de l'utilisateur
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Récupérer les rôles de l'utilisateur
  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Vérifier si l'utilisateur peut modifier l'équipe
  const canModifyTeam = 
    userRoles?.some(role => role.role === "admin") || 
    (project?.project_manager === userProfile?.email);

  // Récupérer les membres actuels du projet
  const { data: currentMembers, refetch: refetchMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          user_id,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching project members:", error);
        throw error;
      }
      return data;
    },
  });

  // Récupérer les utilisateurs disponibles (avec le rôle 'membre')
  const { data: availableUsers } = useQuery({
    queryKey: ["availableMembers", searchQuery, currentMembers, project?.project_manager],
    queryFn: async () => {
      if (!canModifyTeam) return [];
      
      const memberIds = (currentMembers || []).map(m => m.user_id);
      
      let query = supabase
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_roles!inner (
            role
          )
        `)
        .eq("user_roles.role", "membre")
        .ilike("email", `%${searchQuery}%`);

      if (memberIds.length > 0) {
        query = query.not('id', 'in', `(${memberIds.join(',')})`);
      }

      if (project?.project_manager) {
        query = query.neq('email', project.project_manager);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error searching for available members:", error);
        throw error;
      }
      return data;
    },
    enabled: searchQuery.length > 2 && canModifyTeam,
  });

  const handleAddMember = async (userId: string) => {
    if (!canModifyTeam) {
      toast({
        title: "Erreur",
        description: "Vous n'avez pas les droits pour ajouter des membres à l'équipe",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le membre a été ajouté au projet",
      });

      refetchMembers();
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du membre",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!canModifyTeam) {
      toast({
        title: "Erreur",
        description: "Vous n'avez pas les droits pour retirer des membres de l'équipe",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le membre a été retiré du projet",
      });

      refetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du membre",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {canModifyTeam && (
        <div>
          <h3 className="text-lg font-medium mb-4">Ajouter des membres</h3>
          <div className="flex gap-4 items-center">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur par email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          {searchQuery.length > 2 && availableUsers && (
            <div className="mt-4 space-y-2">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddMember(user.id)}
                  >
                    Ajouter
                  </Button>
                </div>
              ))}
              {availableUsers.length === 0 && (
                <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium mb-4">Membres actuels</h3>
        <div className="space-y-2">
          {currentMembers?.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div>
                <p className="font-medium">
                  {member.profiles.first_name} {member.profiles.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.profiles.email}
                </p>
              </div>
              {canModifyTeam && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMember(member.user_id)}
                >
                  <UserMinus className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {(!currentMembers || currentMembers.length === 0) && (
            <p className="text-muted-foreground">Aucun membre dans l'équipe</p>
          )}
        </div>
      </div>
    </div>
  );
};