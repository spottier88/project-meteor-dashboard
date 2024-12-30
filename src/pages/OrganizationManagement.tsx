import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PoleForm } from "@/components/organization/PoleForm";
import { DirectionForm } from "@/components/organization/DirectionForm";
import { ServiceForm } from "@/components/organization/ServiceForm";
import { OrganizationTable } from "@/components/organization/OrganizationTable";
import { useToast } from "@/components/ui/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const OrganizationManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPoleFormOpen, setIsPoleFormOpen] = useState(false);
  const [isDirectionFormOpen, setIsDirectionFormOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);

  const { data: poles, isLoading: isLoadingPoles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*, directions(*, services(*))");
      if (error) throw error;
      return data;
    },
  });

  if (isLoadingPoles) {
    return <div>Chargement...</div>;
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            Retour au tableau de bord
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Gestion de l'organisation
              </h1>
              <p className="text-muted-foreground">
                Gérez la structure organisationnelle
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsPoleFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau pôle
              </Button>
              <Button onClick={() => setIsDirectionFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle direction
              </Button>
              <Button onClick={() => setIsServiceFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau service
              </Button>
            </div>
          </div>
        </div>

        <OrganizationTable data={poles || []} />

        <PoleForm
          isOpen={isPoleFormOpen}
          onClose={() => setIsPoleFormOpen(false)}
        />
        <DirectionForm
          isOpen={isDirectionFormOpen}
          onClose={() => setIsDirectionFormOpen(false)}
          poles={poles || []}
        />
        <ServiceForm
          isOpen={isServiceFormOpen}
          onClose={() => setIsServiceFormOpen(false)}
          poles={poles || []}
        />
      </div>
    </ProtectedRoute>
  );
};