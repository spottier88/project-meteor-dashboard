
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuickActivityForm } from './QuickActivityForm';

export const ActivityEntry = () => {
  return (
    <Dialog>
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
        <QuickActivityForm />
      </DialogContent>
    </Dialog>
  );
};

