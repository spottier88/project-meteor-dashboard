/**
 * @component HierarchyPathAssignmentForm
 * @description Formulaire pour assigner un manager à un chemin hiérarchique.
 * - Pré-sélectionne le chemin correspondant à l'affectation directe de l'utilisateur (defaultPathId).
 * - Grise/désactive les chemins déjà attribués (assignedPathIds) afin d'éviter les erreurs de doublon.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HierarchyPath } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

interface HierarchyPathAssignmentFormProps {
  userId: string;
  onAssignmentAdd: (pathId: string) => void;
  /** Chemins déjà affectés au manager (affichage grisé) */
  assignedPathIds?: string[];
  /** Chemin pré-sélectionné par défaut (affectation directe de l'utilisateur) */
  defaultPathId?: string | null;
}

export const HierarchyPathAssignmentForm = ({
  userId,
  onAssignmentAdd,
  assignedPathIds = [],
  defaultPathId = null,
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

  // Pré-sélection du chemin par défaut (affectation directe) si pas encore attribué
  useEffect(() => {
    if (
      defaultPathId &&
      !selectedPathId &&
      !assignedPathIds.includes(defaultPathId)
    ) {
      setSelectedPathId(defaultPathId);
    }
  }, [defaultPathId, assignedPathIds, selectedPathId]);

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
        <CardTitle>Affectation manuelle</CardTitle>
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
                {hierarchyPaths?.map((path) => {
                  const already = assignedPathIds.includes(path.id);
                  return (
                    <SelectItem
                      key={path.id}
                      value={path.id}
                      disabled={already}
                    >
                      {path.path_string}
                      {already ? " (déjà affecté)" : ""}
                    </SelectItem>
                  );
                })}
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
