
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ActivityTypeForm } from "./ActivityTypeForm";
import { ActivityType } from "@/types/activity";
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

export const ActivityTypeManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | undefined>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer les types d'activités
  const { data: activityTypes, isLoading } = useQuery({
    queryKey: ["activityTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ActivityType[];
    },
  });

  // Mutation pour supprimer un type d'activité
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Vérifier si le type est utilisé par des activités
      const { count, error: countError } = await supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("activity_type", selectedActivityType?.code || "");

      if (countError) throw countError;

      // Si le type est utilisé, ne pas permettre la suppression
      if (count && count > 0) {
        throw new Error(`Ce type d'activité est utilisé par ${count} activité(s) et ne peut pas être supprimé.`);
      }

      const { error } = await supabase
        .from("activity_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityTypes"] });
      toast({
        title: "Type d'activité supprimé",
        description: "Le type d'activité a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression du type d'activité.",
      });
    },
  });

  // Mutation pour modifier l'ordre d'affichage
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("activity_types")
        .update({ display_order: newOrder })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityTypes"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de l'ordre d'affichage.",
      });
    },
  });

  const handleOpenEditForm = (activityType: ActivityType) => {
    setSelectedActivityType(activityType);
    setIsFormOpen(true);
  };

  const handleOpenAddForm = () => {
    setSelectedActivityType(undefined);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (activityType: ActivityType) => {
    setSelectedActivityType(activityType);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedActivityType) {
      deleteMutation.mutate(selectedActivityType.id);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0 || !activityTypes) return;
    
    const currentItem = activityTypes[index];
    const prevItem = activityTypes[index - 1];
    
    updateOrderMutation.mutate({ id: currentItem.id, newOrder: prevItem.display_order });
    updateOrderMutation.mutate({ id: prevItem.id, newOrder: currentItem.display_order });
  };

  const handleMoveDown = (index: number) => {
    if (!activityTypes || index >= activityTypes.length - 1) return;
    
    const currentItem = activityTypes[index];
    const nextItem = activityTypes[index + 1];
    
    updateOrderMutation.mutate({ id: currentItem.id, newOrder: nextItem.display_order });
    updateOrderMutation.mutate({ id: nextItem.id, newOrder: currentItem.display_order });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Types d'activités</h2>
        <Button onClick={handleOpenAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un type
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Couleur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : activityTypes && activityTypes.length > 0 ? (
                activityTypes.map((activityType, index) => (
                  <TableRow key={activityType.id}>
                    <TableCell className="flex items-center gap-2">
                      <span>{activityType.display_order}</span>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === activityTypes.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{activityType.code}</TableCell>
                    <TableCell>{activityType.label}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md"
                          style={{ backgroundColor: activityType.color }}
                        ></div>
                        <span>{activityType.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activityType.is_active ? (
                        <Badge variant="default">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditForm(activityType)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(activityType)}
                          title="Supprimer"
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
        </CardContent>
      </Card>

      <ActivityTypeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={() => queryClient.invalidateQueries({ queryKey: ["activityTypes"] })}
        activityType={selectedActivityType}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce type d'activité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Si des activités utilisent ce type, vous ne pourrez pas le supprimer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
