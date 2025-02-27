
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GeneralSettings as GeneralSettingsComponent } from '@/components/admin/GeneralSettings';

export default function GeneralSettings() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to="/admin">
              <ChevronLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres généraux</h1>
        </div>
      </div>
      
      <div className="border rounded-md p-6 bg-white">
        <GeneralSettingsComponent />
      </div>
    </div>
  );
}
