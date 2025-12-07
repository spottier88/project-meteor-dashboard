
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAddPortfolioManager } from "@/hooks/usePortfolioManagers";
import { UserProfile } from "@/types/user";

interface AddPortfolioManagerFormProps {
  portfolioId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddPortfolioManagerForm = ({ portfolioId, isOpen, onClose }: AddPortfolioManagerFormProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  
  const addManager = useAddPortfolioManager();

  // Récupérer les utilisateurs éligibles (ayant le rôle portfolio_manager)
  const { data: eligibleUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["eligible-portfolio-managers", portfolioId],
    queryFn: async () => {
      // Récupérer les utilisateurs avec le rôle portfolio_manager
      const { data: usersWithRole, error: roleError } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          profiles!user_roles_user_id_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("role", "portfolio_manager");

      if (roleError) throw roleError;

      // Récupérer les gestionnaires déjà assignés au portefeuille
      const { data: existingManagers, error: managersError } = await supabase
        .from("portfolio_managers")
        .select("user_id")
        .eq("portfolio_id", portfolioId);

      if (managersError) throw managersError;

      const existingManagerIds = existingManagers?.map(m => m.user_id) || [];
      
      // Filtrer les utilisateurs déjà assignés
      const availableUsers = usersWithRole
        ?.filter(userRole => !existingManagerIds.includes(userRole.user_id))
        .map(userRole => userRole.profiles)
        .filter(profile => profile !== null) as UserProfile[];

      return availableUsers || [];
    },
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) return;

    try {
      await addManager.mutateAsync({
        portfolioId,
        userId: selectedUserId,
        role: selectedRole,
      });
      
      setSelectedUserId("");
      setSelectedRole("manager");
      onClose();
    } catch (error) {
      // L'erreur est gérée dans le hook
    }
  };

  const formatUserName = (user: UserProfile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || 'Utilisateur inconnu';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un gestionnaire</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Utilisateur</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {loadingUsers ? (
                  <SelectItem value="loading" disabled>Chargement...</SelectItem>
                ) : eligibleUsers?.length === 0 ? (
                  <SelectItem value="no-users" disabled>Aucun utilisateur disponible</SelectItem>
                ) : (
                  eligibleUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{formatUserName(user)}</span>
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Gestionnaire</SelectItem>
                <SelectItem value="viewer">Lecteur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedUserId || addManager.isPending || selectedUserId === "loading" || selectedUserId === "no-users"}
            >
              {addManager.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
