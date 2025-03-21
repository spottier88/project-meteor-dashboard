
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QuickActivityForm from './QuickActivityForm';
import { BulkActivityEntryDrawer } from './BulkActivityEntry';
import { useLocation } from 'react-router-dom';

export const ActivityEntry = () => {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const isPersonalActivityPage = location.pathname === '/activities';

  // Fonction de fermeture contrôlée
  const handleOpenChange = (open: boolean) => {
    // Si on essaie de fermer, le QuickActivityForm va s'occuper de la logique
    // de vérification des modifications non sauvegardées
    if (!open) {
      // Ne pas fermer directement, le formulaire va gérer ça
      return;
    }
    // Si on ouvre, pas de problème
    setOpen(open);
  };

  return (
    <div className="flex gap-2">
      {isPersonalActivityPage && <BulkActivityEntryDrawer />}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle activité
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saisie rapide d'activité</DialogTitle>
          </DialogHeader>
          <QuickActivityForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
