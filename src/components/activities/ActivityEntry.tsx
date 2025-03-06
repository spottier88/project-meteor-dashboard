
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QuickActivityForm from './QuickActivityForm';

export const ActivityEntry = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
  );
};
