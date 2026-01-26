/**
 * @file AddPortfolioManagerForm.tsx
 * @description Formulaire d'ajout d'un gestionnaire à un portefeuille
 * Utilise une recherche intégrée dans le Dialog pour éviter les conflits de focus trap
 */

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAddPortfolioManager } from "@/hooks/usePortfolioManagers";
import { UserProfile } from "@/types/user";
import { Check, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddPortfolioManagerFormProps {
  portfolioId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddPortfolioManagerForm = ({ portfolioId, isOpen, onClose }: AddPortfolioManagerFormProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  const [searchQuery, setSearchQuery] = useState("");
  
  const addManager = useAddPortfolioManager();

  // Récupérer les utilisateurs éligibles (ayant le rôle portfolio_manager)
  const { data: eligibleUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["eligible-portfolio-managers", portfolioId],
    queryFn: async () => {
      // Étape 1 : Récupérer les user_id avec le rôle portfolio_manager
      const { data: usersWithRole, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "portfolio_manager");

      if (roleError) throw roleError;
      if (!usersWithRole || usersWithRole.length === 0) return [];

      // Étape 2 : Récupérer les gestionnaires déjà assignés au portefeuille
      const { data: existingManagers, error: managersError } = await supabase
        .from("portfolio_managers")
        .select("user_id")
        .eq("portfolio_id", portfolioId);

      if (managersError) throw managersError;

      const existingManagerIds = existingManagers?.map(m => m.user_id) || [];
      
      // Filtrer les utilisateurs déjà assignés
      const availableUserIds = usersWithRole
        .map(ur => ur.user_id)
        .filter(userId => !existingManagerIds.includes(userId));

      if (availableUserIds.length === 0) return [];

      // Étape 3 : Récupérer les profils des utilisateurs disponibles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", availableUserIds);

      if (profilesError) throw profilesError;

      return (profiles || []) as UserProfile[];
    },
    enabled: isOpen,
  });

  // Formater le nom complet d'un utilisateur
  const formatUserName = (user: UserProfile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || 'Utilisateur inconnu';
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = useMemo(() => {
    if (!eligibleUsers) return [];
    if (!searchQuery.trim()) return eligibleUsers;
    
    const query = searchQuery.toLowerCase();
    return eligibleUsers.filter((user) => {
      const name = formatUserName(user).toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [eligibleUsers, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) return;

    try {
      await addManager.mutateAsync({
        portfolioId,
        userId: selectedUserId,
        role: selectedRole,
      });
      
      // Réinitialiser le formulaire
      setSelectedUserId("");
      setSelectedRole("manager");
      setSearchQuery("");
      onClose();
    } catch (error) {
      // L'erreur est gérée dans le hook
    }
  };

  // Gérer la fermeture du dialog avec réinitialisation
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchQuery("");
      setSelectedUserId("");
      setSelectedRole("manager");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un gestionnaire</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Utilisateur</Label>
            
            {/* Champ de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Liste des utilisateurs */}
            <ScrollArea className="h-48 rounded-md border">
              <div className="p-2">
                {loadingUsers ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Chargement...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" />
                    <p className="text-sm">Aucun utilisateur disponible</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUserId === user.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isSelected && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">
                              {formatUserName(user)}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
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
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedUserId || addManager.isPending}
            >
              {addManager.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
