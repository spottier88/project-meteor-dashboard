import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RiskForm } from "./RiskForm";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RiskCard } from "./risk/RiskCard";
import { useUser } from "@supabase/auth-helpers-react";
import { canManageProjectItems } from "@/utils/permissions";
import { UserRoleData } from "@/types/user";

interface RiskListProps {
  projectId: string;
  projectTitle: string;
}

export const RiskList = ({ projectId, projectTitle }: RiskListProps) => {
  const { toast } = useToast();
  const user = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [riskToDelete, setRiskToDelete] = useState<any>(null);

  // Add error handling for undefined projectId
  if (!projectId) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Identifiant du projet manquant
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId, // Only run query if projectId exists
  });

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const { data: risks, refetch, isLoading: isLoadingRisks } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId, // Only run query if projectId exists
  });

  // Show loading state
  if (isLoadingProject || isLoadingProfile || isLoadingRoles || isLoadingRisks) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Chargement des risques...
          </div>
        </CardContent>
      </Card>
    );
  }

  const roles = userRoles?.map(ur => ur.role);
  const canManage = canManageProjectItems(
    roles,
    user?.id,
    project?.owner_id,
    project?.project_manager,
    userProfile?.email
  );

  const handleDelete = async () => {
    if (!riskToDelete) return;

    try {
      const { error } = await supabase
        .from("risks")
        .delete()
        .eq("id", riskToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le risque a été supprimé",
      });

      refetch();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setRiskToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Risques du projet</h2>
        {canManage && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un risque
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {risks?.map((risk) => (
          <RiskCard
            key={risk.id}
            risk={risk}
            onEdit={(risk) => {
              setSelectedRisk(risk);
              setIsFormOpen(true);
            }}
            onDelete={setRiskToDelete}
            showActions={canManage}
          />
        ))}

        {risks?.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Aucun risque n'a été ajouté à ce projet
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <RiskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRisk(null);
        }}
        onSubmit={refetch}
        projectId={projectId}
        risk={selectedRisk || undefined}
      />

      <AlertDialog open={!!riskToDelete} onOpenChange={() => setRiskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Le risque sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};