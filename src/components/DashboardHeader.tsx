import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { UserInfo } from "./UserInfo";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { canCreateProject } from "@/utils/permissions";

interface DashboardHeaderProps {
  onNewProject: () => void;
  onNewReview: () => void;
}

export const DashboardHeader = ({ onNewProject, onNewReview }: DashboardHeaderProps) => {
  const user = useUser();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-4 mb-8">
      <UserInfo />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord des Projets</h1>
          <p className="text-muted-foreground">
            Suivez et évaluez l'état et la progression de vos projets
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          {canCreateProject(userProfile?.role) && (
            <Button
              onClick={onNewProject}
              className="w-full md:w-auto animate-fade-in"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau Projet
            </Button>
          )}
          <Button
            onClick={onNewReview}
            variant="outline"
            className="w-full md:w-auto animate-fade-in"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle Revue
          </Button>
        </div>
      </div>
    </div>
  );
};