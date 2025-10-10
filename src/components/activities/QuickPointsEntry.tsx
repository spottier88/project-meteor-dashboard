import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, List } from "lucide-react";
import { useRecentProjects } from "@/hooks/useRecentProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { PointsVisualization } from "./PointsVisualization";
import { useUserPreferences } from "@/hooks/useUserPreferences";

/**
 * Interface pour une ligne de saisie rapide
 */
interface QuickEntry {
  projectId: string;
  projectTitle: string;
  points: number;
  activityType: string;
  description: string;
}

interface QuickPointsEntryProps {
  onSubmit: (entry: QuickEntry) => void;
  onOpenFullForm: () => void;
  pointsRemaining: number;
  isSubmitting: boolean;
}

/**
 * Composant de saisie rapide de points sur les projets récents
 * Affiche un tableau avec les projets favoris/récents pour une saisie rapide
 */
export const QuickPointsEntry: React.FC<QuickPointsEntryProps> = ({
  onSubmit,
  onOpenFullForm,
  pointsRemaining,
  isSubmitting,
}) => {
  const { data: recentProjects, isLoading } = useRecentProjects();
  const [entries, setEntries] = useState<Map<string, Partial<QuickEntry>>>(new Map());
  const { getPreference } = useUserPreferences();
  const useCookieMode = getPreference('points_visualization_mode', 'classic') === 'cookies';

  // Récupérer les types d'activités
  const { data: activityTypes } = useQuery({
    queryKey: ["activityTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("code, label, color")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  // Mise à jour d'une entrée
  const updateEntry = (projectId: string, field: string, value: any) => {
    setEntries((prev) => {
      const newEntries = new Map(prev);
      const entry = newEntries.get(projectId) || {};
      newEntries.set(projectId, { ...entry, [field]: value });
      return newEntries;
    });
  };

  // Validation et soumission d'une entrée
  const handleSubmitEntry = (projectId: string, projectTitle: string) => {
    const entry = entries.get(projectId);
    
    if (!entry?.points || entry.points <= 0) {
      return;
    }

    onSubmit({
      projectId,
      projectTitle,
      points: entry.points,
      activityType: entry.activityType || "",
      description: entry.description || "",
    });

    // Réinitialiser l'entrée après soumission
    setEntries((prev) => {
      const newEntries = new Map(prev);
      newEntries.delete(projectId);
      return newEntries;
    });
  };

  // Gestion de la touche Enter pour soumettre
  const handleKeyPress = (e: React.KeyboardEvent, projectId: string, projectTitle: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitEntry(projectId, projectTitle);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Chargement des projets...
      </div>
    );
  }

  if (!recentProjects || recentProjects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Aucun projet récent. Utilisez le formulaire complet pour commencer.
        </p>
        <Button onClick={onOpenFullForm}>
          <List className="h-4 w-4 mr-2" />
          Tous les projets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Saisie rapide</h3>
          <p className="text-sm text-muted-foreground">
            Vos projets récents - Appuyez sur Entrée pour valider
          </p>
        </div>
        <Button variant="outline" onClick={onOpenFullForm}>
          <List className="h-4 w-4 mr-2" />
          Tous les projets
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Projet</TableHead>
              <TableHead className="w-[15%]">Points *</TableHead>
              <TableHead className="w-[20%]">Type d'activité</TableHead>
              <TableHead className="w-[25%]">Description</TableHead>
              <TableHead className="w-[10%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentProjects.map((project: any) => {
              const entry = entries.get(project.id) || {};
              const canSubmit = entry.points && entry.points > 0 && entry.points <= pointsRemaining;

              return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full bg-primary"
                        title="Projet récent"
                      />
                      {project.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={pointsRemaining}
                        placeholder="0"
                        value={entry.points || ""}
                        onChange={(e) =>
                          updateEntry(project.id, "points", parseInt(e.target.value, 10) || 0)
                        }
                        onKeyPress={(e) => handleKeyPress(e, project.id, project.title)}
                        disabled={isSubmitting || pointsRemaining <= 0}
                        className="w-20"
                      />
                      {useCookieMode && entry.points && entry.points > 0 && (
                        <div className="ml-2">
                          <PointsVisualization points={entry.points} size="sm" animated={false} />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={entry.activityType || ""}
                      onValueChange={(value) => updateEntry(project.id, "activityType", value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes?.map((type) => (
                          <SelectItem key={type.code} value={type.code}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: type.color }}
                              />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Description..."
                      value={entry.description || ""}
                      onChange={(e) => updateEntry(project.id, "description", e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, project.id, project.title)}
                      disabled={isSubmitting}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSubmitEntry(project.id, project.title)}
                      disabled={!canSubmit || isSubmitting}
                      title="Ajouter les points (ou appuyez sur Entrée)"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pointsRemaining <= 0 && (
        <div className="text-center py-2">
          <Badge variant="destructive">
            Quota de points atteint pour cette semaine
          </Badge>
        </div>
      )}
    </div>
  );
};
