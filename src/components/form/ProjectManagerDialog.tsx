import { useState, useMemo } from "react";
import { Check, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfile } from "@/types/user";

interface ProjectManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  projectManagers: UserProfile[];
}

/**
 * Composant modal de sélection du chef de projet
 * Permet de rechercher et sélectionner un chef de projet parmi la liste disponible
 * Remplace le Combobox pour éviter les problèmes d'interaction dans les dialogs imbriqués
 */
export const ProjectManagerDialog = ({
  isOpen,
  onClose,
  value,
  onChange,
  projectManagers,
}: ProjectManagerDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(value);

  // Réinitialiser la sélection et la recherche à l'ouverture
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedEmail(value);
      setSearchQuery("");
    } else {
      onClose();
    }
  };

  // Formater le nom complet d'un manager
  const getManagerDisplayName = (manager: UserProfile) => {
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`;
    }
    return manager.email || "";
  };

  // Filtrer les managers selon la recherche
  const filteredManagers = useMemo(() => {
    if (!searchQuery.trim()) return projectManagers;
    
    const query = searchQuery.toLowerCase();
    return projectManagers.filter((manager) => {
      const name = getManagerDisplayName(manager).toLowerCase();
      const email = (manager.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [projectManagers, searchQuery]);

  // Valider la sélection
  const handleValidate = () => {
    onChange(selectedEmail);
    onClose();
  };

  // Annuler et fermer
  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sélectionner un chef de projet</DialogTitle>
        </DialogHeader>

        {/* Champ de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Liste des managers */}
        <ScrollArea className="h-64 rounded-md border">
          <div className="p-2">
            {filteredManagers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mb-2" />
                <p className="text-sm">Aucun chef de projet trouvé</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredManagers.map((manager) => {
                  const isSelected = selectedEmail === manager.email;
                  return (
                    <button
                      key={manager.id}
                      type="button"
                      onClick={() => setSelectedEmail(manager.email || "")}
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
                          {getManagerDisplayName(manager)}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {manager.email}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button type="button" onClick={handleValidate}>
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
