/**
 * @component IncompleteProfileDialog
 * @description Modale d'incitation à compléter le profil utilisateur.
 * Affiche les informations manquantes et propose de compléter le profil
 * ou de reporter le rappel.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useIncompleteProfile } from "@/hooks/useIncompleteProfile";

interface IncompleteProfileDialogProps {
  onOpenProfile: () => void;
}

/**
 * Modale non-bloquante affichée aux utilisateurs existants
 * dont le profil est incomplet (nom, prénom ou affectation manquante).
 */
export const IncompleteProfileDialog = ({ onOpenProfile }: IncompleteProfileDialogProps) => {
  const { 
    shouldShowDialog, 
    completionStatus, 
    dismissDialog, 
    remindLater 
  } = useIncompleteProfile();
  
  const [isOpen, setIsOpen] = useState(true);

  // Gère la fermeture de la modale
  const handleClose = () => {
    setIsOpen(false);
    dismissDialog();
  };

  // Reporter le rappel d'un jour
  const handleRemindLater = () => {
    remindLater(1);
    setIsOpen(false);
  };

  // Reporter le rappel d'une semaine
  const handleRemindNextWeek = () => {
    remindLater(7);
    setIsOpen(false);
  };

  // Ouvrir le formulaire de profil
  const handleOpenProfile = () => {
    onOpenProfile();
    handleClose();
  };

  if (!shouldShowDialog || !isOpen) return null;

  // Calcul du pourcentage de complétion
  const completedItems = [
    completionStatus.hasFirstName,
    completionStatus.hasLastName,
    completionStatus.hasHierarchyAssignment,
  ].filter(Boolean).length;
  const completionPercentage = Math.round((completedItems / 3) * 100);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Complétez votre profil
          </DialogTitle>
          <DialogDescription>
            Quelques informations sont manquantes pour personnaliser votre expérience.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Barre de progression */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progression du profil</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Liste des éléments à compléter */}
          <div className="space-y-2">
            <ProfileItem 
              label="Prénom" 
              isComplete={completionStatus.hasFirstName}
              icon={User}
            />
            <ProfileItem 
              label="Nom" 
              isComplete={completionStatus.hasLastName}
              icon={User}
            />
            <ProfileItem 
              label="Affectation" 
              isComplete={completionStatus.hasHierarchyAssignment}
              icon={Building2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRemindLater}
              className="flex-1 sm:flex-none text-xs px-2"
            >
              <Clock className="h-3 w-3 mr-1" />
              Demain
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRemindNextWeek}
              className="flex-1 sm:flex-none text-xs px-2"
            >
              <Clock className="h-3 w-3 mr-1" />
              7 jours
            </Button>
          </div>
          <Button onClick={handleOpenProfile} className="w-full sm:w-auto order-1 sm:order-2">
            Compléter mon profil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Composant interne pour afficher un élément de profil avec son statut
 */
const ProfileItem = ({ 
  label, 
  isComplete, 
  icon: Icon 
}: { 
  label: string; 
  isComplete: boolean; 
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm">{label}</span>
    </div>
    {isComplete ? (
      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs px-2 py-0.5">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        OK
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200 text-xs px-2 py-0.5">
        <XCircle className="h-3 w-3 mr-1" />
        Manquant
      </Badge>
    )}
  </div>
);
