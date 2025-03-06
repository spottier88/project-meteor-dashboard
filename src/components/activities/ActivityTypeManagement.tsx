import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Edit, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus,
  AlertTriangle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ActivityTypeForm } from "./ActivityTypeForm";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const ActivityTypeManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ActivityType | null>(null);

  const { data: activityTypes, isLoading, error } = useQuery({
    queryKey: ["activity-types-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ActivityType[];
    },
  });

  const { data: usageCheck, refetch: refetchUsage } = useQuery({
    queryKey: ["activity-type-usage", typeToDelete?.code],
    queryFn: async () => {
      if (!typeToDelete) return { count: 0 };
      
      const { count, error } = await supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("activity_type", typeToDelete.code as any);
        
      if (error) throw error;
      return { count: count || 0 };
    },
    enabled: !!typeToDelete,
  });

  const toggleActive = async (type: ActivityType) => {
    try {
      const { error } = await supabase
        .from("activity_types")
        .update({ is_active: !type.is_active })
        .eq("id", type.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Le type d'activité a été ${type.is_active ? "désactivé" : "activé"}`,
      });

      queryClient.invalidateQueries({ queryKey: ["activity-types-management"] });
    } catch (error) {
      console.error("Error toggling activity type active state:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const moveOrder = async (type: ActivityType, direction: "up" | "down") => {
    try {
      if (!activityTypes) return;

      const currentIndex = activityTypes.findIndex(t => t.id === type.id);
      if (currentIndex === -1) return;

      let swapIndex;
      if (direction === "up" && currentIndex > 0) {
        swapIndex = currentIndex - 1;
      } else if (direction === "down" && currentIndex < activityTypes.length - 1) {
        swapIndex = currentIndex + 1;
      } else {
        return;
      }

      const otherType = activityTypes[swapIndex];
      
      const { error: error1 } = await supabase
        .from("activity_types")
        .update({ display_order: otherType.display_order })
        .eq("id", type.id);

      const { error: error2 } = await supabase
        .from("activity_types")
        .update({ display_order: type.display_order })
        .eq("id", otherType.id);

      if (error1 || error2) throw error1 || error2;

      toast({
        title: "Succès",
        description: "L'ordre d'affichage a été modifié",
      });

      queryClient.invalidateQueries({ queryKey: ["activity-types-management"] });
    } catch (error) {
      console.error("Error changing display order:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du changement d'ordre",
        variant: "destructive",
      });
    }
  };

  const openEditForm = (type: ActivityType) => {
    setSelectedType(type);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setSelectedType(undefined);
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ["activity-types-management"] });
    queryClient.invalidateQueries({ queryKey: ["activity-types"] });
    setIsFormOpen(false);
  };

  const confirmDelete = (type: ActivityType) => {
    setTypeToDelete(type);
    refetchUsage();
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    try {
      const { error } = await supabase
        .from("activity_types")
        .delete()
        .eq("id", typeToDelete.id);

      if (error) throw error;

      toast({
        title: "Suppression réussie",
        description: `Le type d'activité "${typeToDelete.label}" a été supprimé`,
      });

      queryClient.invalidateQueries({ queryKey: ["activity-types-management"] });
      queryClient.invalidateQueries({ queryKey: ["activity-types"] });
      setIsDeleteDialogOpen(false);
      setTypeToDelete(null);
    } catch (error: any) {
      console.error("Error deleting activity type:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Chargement des types d'activités...</div>;
  }

  if (error) {
    return <div>Erreur lors du chargement des types d'activités</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Types d'activités</h2>
        <Button onClick={openAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un type
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Couleur</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead>Ordre</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityTypes && activityTypes.length > 0 ? (
              activityTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-mono">{type.code}</TableCell>
                  <TableCell>{type.label}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm">{type.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={type.is_active}
                      onCheckedChange={() => toggleActive(type)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveOrder(type, "up")}
                        disabled={activityTypes.indexOf(type) === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveOrder(type, "down")}
                        disabled={activityTypes.indexOf(type) === activityTypes.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(type)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Aucun type d'activité trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ActivityTypeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        activityType={selectedType}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {usageCheck && usageCheck.count > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-amber-500 gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Ce type d'activité est utilisé dans {usageCheck.count} activité(s).</span>
                  </div>
                  <p>Êtes-vous sûr de vouloir le supprimer ? Cette action est irréversible.</p>
                </div>
              ) : (
                "Êtes-vous sûr de vouloir supprimer ce type d'activité ? Cette action est irréversible."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
