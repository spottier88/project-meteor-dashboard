/**
 * @component HierarchyPathAssignmentForm
 * @description Formulaire pour assigner un manager à un chemin hiérarchique.
 * Permet de sélectionner un chemin hiérarchique (combinaison pôle/direction/service)
 * et d'y affecter un manager, donnant ainsi des droits sur tous les projets associés.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HierarchyPath } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

interface HierarchyPathAssignmentFormProps {
  userId: string;
  onAssignmentAdd: (pathId: string) => void;
}

export const HierarchyPathAssignmentForm = ({
  userId,
  onAssignmentAdd,
}: HierarchyPathAssignmentFormProps) => {
  const [selectedPathId, setSelectedPathId] = useState<string>("");
  const { toast } = useToast();

  const { data: hierarchyPaths, isLoading } = useQuery({
    queryKey: ["hierarchyPaths"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hierarchy_paths")
        .select("*")
        .order("path_string");
      if (error) throw error;
      return data as HierarchyPath[];
    },
  });

  const handleAddAssignment = () => {
    if (!selectedPathId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un chemin hiérarchique",
        variant: "destructive",
      });
      return;
    }

    onAssignmentAdd(selectedPathId);
    setSelectedPathId("");
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle affectation hiérarchique</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Chemin hiérarchique</Label>
            <Select value={selectedPathId} onValueChange={setSelectedPathId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un chemin hiérarchique" />
              </SelectTrigger>
              <SelectContent>
                {hierarchyPaths?.map((path) => (
                  <SelectItem key={path.id} value={path.id}>
                    {path.path_string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAddAssignment}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter l'affectation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
