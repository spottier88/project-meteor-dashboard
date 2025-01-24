import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, UserMinus } from "lucide-react";

interface TeamManagementProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const TeamManagement = ({ isOpen, onClose, projectId }: TeamManagementProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Récupérer les membres actuels du projet
  const { data: currentMembers, refetch: refetchMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      console.log("Fetching current project members for project:", projectId);
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
      console.log("Current project members:", data);
      return data;
    },
  });

  // Récupérer les utilisateurs disponibles (avec le rôle 'membre')
  const { data: availableUsers } = useQuery({
    queryKey: ["availableMembers", searchQuery, currentMembers],
    queryFn: async () => {
      console.log("Searching for available members with query:", searchQuery);
      const memberIds = (currentMembers || []).map(m => m.user_id);
      console.log("Current members to exclude:", memberIds);
      
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

      // N'ajouter la condition not.in que s'il y a des membres à exclure
      if (memberIds.length > 0) {
        query = query.not('id', 'in', `(${memberIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error searching for available members:", error);
        throw error;
      }
      console.log("Available users found:", data);
      return data;
    },
    enabled: searchQuery.length > 2,
  });

  const handleAddMember = async (userId: string) => {
    try {
      console.log("Adding member to project:", { userId, projectId });
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
        });

      if (error) {
        console.error("Error adding member:", error);
        throw error;
      }

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
    try {
      console.log("Removing member from project:", { userId, projectId });
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing member:", error);
        throw error;
      }

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestion de l'équipe projet</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};