import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, UserMinus, Loader2 } from "lucide-react";
import debounce from "lodash/debounce";

interface TeamManagementProps {
  projectId: string;
}

export const TeamManagement = ({ projectId }: TeamManagementProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Récupérer les informations du projet
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

  // Récupérer les membres actuels du projet avec une requête optimisée
  const { data: currentMembers, refetch: refetchMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          user_id,
          user:profiles!inner (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
  });

  // Recherche d'utilisateurs disponibles avec debounce
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      setIsSearching(true);
      const memberIds = (currentMembers || []).map(m => m.user_id);
      
      const { data, error } = await supabase
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
        .ilike("email", `%${query}%`)
        .limit(10); // Limite le nombre de résultats pour de meilleures performances

      if (error) throw error;
      
      // Filtrer les membres actuels et le chef de projet
      const filteredData = data?.filter(user => 
        !memberIds.includes(user.id) && 
        user.email !== project?.project_manager
      ) || [];

      setAvailableUsers(filteredData);
      setIsSearching(false);
    }, 500),
    [currentMembers, project?.project_manager]
  );

  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  }>>([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      debouncedSearch(query);
    } else {
      setAvailableUsers([]);
    }
  };

  const handleAddMember = async (userId: string) => {
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

      // Réinitialiser la recherche
      setSearchQuery("");
      setAvailableUsers([]);
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
      <div>
        <h3 className="text-lg font-medium mb-4">Ajouter des membres</h3>
        <div className="flex gap-4 items-center">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur par email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1"
          />
        </div>
        {searchQuery.length > 2 && (
          <div className="mt-4 space-y-2">
            {isSearching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Membres actuels</h3>
        <div className="space-y-2">
          {isLoadingMembers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {currentMembers?.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {member.user.first_name} {member.user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member.user_id)}
                  >
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(!currentMembers || currentMembers.length === 0) && (
                <p className="text-muted-foreground">Aucun membre dans l'équipe</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};