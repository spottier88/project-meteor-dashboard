/**
 * @file AddPortfolioManagerForm.tsx
 * @description Formulaire d'ajout d'un gestionnaire à un portefeuille
 * Utilise un Combobox avec recherche pour faciliter la sélection parmi de nombreux utilisateurs
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAddPortfolioManager } from "@/hooks/usePortfolioManagers";
import { UserProfile } from "@/types/user";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AddPortfolioManagerFormProps {
  portfolioId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddPortfolioManagerForm = ({ portfolioId, isOpen, onClose }: AddPortfolioManagerFormProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  const [open, setOpen] = useState(false);
  
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedUserId && eligibleUsers?.find(u => u.id === selectedUserId) ? (
                    <span className="truncate">
                      {formatUserName(eligibleUsers.find(u => u.id === selectedUserId)!)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Rechercher un utilisateur...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher par nom ou email..." />
                  <CommandList>
                    {loadingUsers ? (
                      <div className="py-6 text-center text-sm">Chargement...</div>
                    ) : (
                      <>
                        <CommandEmpty>Aucun utilisateur disponible</CommandEmpty>
                        <CommandGroup>
                          {eligibleUsers?.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${formatUserName(user)} ${user.email || ''}`.toLowerCase()}
                              onSelect={() => {
                                setSelectedUserId(user.id);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{formatUserName(user)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
