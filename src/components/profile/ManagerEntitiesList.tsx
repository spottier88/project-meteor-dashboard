
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface ManagerEntitiesListProps {
  userId: string;
}

interface EntityWithDetails {
  id: string;
  entity_type: string;
  entity_details: {
    name: string;
  };
}

export const ManagerEntitiesList = ({ userId }: ManagerEntitiesListProps) => {
  const { data: directAssignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["manager_assignments", userId],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("manager_assignments")
        .select("id, entity_type, entity_id")
        .eq("user_id", userId);

      if (error) throw error;

      // Récupérer les détails pour chaque entité
      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          let entityData = null;
          
          if (assignment.entity_type === 'pole') {
            const { data } = await supabase
              .from('poles')
              .select('name')
              .eq('id', assignment.entity_id)
              .maybeSingle();
            entityData = data;
          } else if (assignment.entity_type === 'direction') {
            const { data } = await supabase
              .from('directions')
              .select('name')
              .eq('id', assignment.entity_id)
              .maybeSingle();
            entityData = data;
          } else if (assignment.entity_type === 'service') {
            const { data } = await supabase
              .from('services')
              .select('name')
              .eq('id', assignment.entity_id)
              .maybeSingle();
            entityData = data;
          }
          
          return {
            id: assignment.id,
            entity_type: assignment.entity_type,
            entity_details: {
              name: entityData?.name || "Inconnu"
            }
          };
        })
      );

      return enrichedAssignments as EntityWithDetails[];
    },
    enabled: !!userId,
  });

  const { data: pathAssignments, isLoading: isLoadingPathAssignments } = useQuery({
    queryKey: ["manager_path_assignments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_path_assignments")
        .select(`
          id,
          path:hierarchy_paths (
            id,
            path_string
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        entity_type: 'path',
        entity_details: {
          name: item.path?.path_string || "Inconnu"
        }
      })) as EntityWithDetails[];
    },
    enabled: !!userId,
  });

  if (isLoadingAssignments || isLoadingPathAssignments) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasDirectAssignments = directAssignments && directAssignments.length > 0;
  const hasPathAssignments = pathAssignments && pathAssignments.length > 0;
  const noAssignments = !hasDirectAssignments && !hasPathAssignments;

  const getEntityTypeLabel = (type: string): string => {
    switch (type) {
      case 'pole':
        return 'Pôle';
      case 'direction':
        return 'Direction';
      case 'service':
        return 'Service';
      case 'path':
        return 'Chemin hiérarchique';
      default:
        return type;
    }
  };

  return (
    <Card className="bg-secondary/20">
      <CardContent className="pt-6">
        {noAssignments && (
          <p className="text-center text-muted-foreground py-4">
            Vous n'avez actuellement aucune attribution de gestion
          </p>
        )}
        
        {hasDirectAssignments && (
          <div className="mb-4">
            <h4 className="font-medium mb-2 text-sm">Entités directes</h4>
            <div className="space-y-2">
              {directAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                  <Badge variant="outline">
                    {getEntityTypeLabel(assignment.entity_type)}
                  </Badge>
                  <span className="text-sm">
                    {assignment.entity_details.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {hasDirectAssignments && hasPathAssignments && (
          <Separator className="my-4" />
        )}
        
        {hasPathAssignments && (
          <div>
            <h4 className="font-medium mb-2 text-sm">Chemins hiérarchiques</h4>
            <div className="space-y-2">
              {pathAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                  <Badge variant="outline">
                    {getEntityTypeLabel(assignment.entity_type)}
                  </Badge>
                  <span className="text-sm">
                    {assignment.entity_details.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
