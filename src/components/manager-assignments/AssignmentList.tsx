import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AssignmentListProps {
  userId: string;
  onAssignmentDeleted: () => void;
}

export const AssignmentList = ({ userId, onAssignmentDeleted }: AssignmentListProps) => {
  const { toast } = useToast();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["manager_assignments", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("manager_assignments")
        .select(`
          id,
          pole_id,
          direction_id,
          service_id,
          poles (id, name),
          directions (id, name),
          services (id, name)
        `)
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const handleDelete = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("manager_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'affectation a été supprimée",
      });

      onAssignmentDeleted();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Chargement des affectations...</div>;
  }

  if (!assignments?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Aucune affectation
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex gap-2 flex-wrap">
              {assignment.poles && (
                <Badge variant="secondary">
                  Pôle: {assignment.poles.name}
                </Badge>
              )}
              {assignment.directions && (
                <Badge variant="secondary">
                  Direction: {assignment.directions.name}
                </Badge>
              )}
              {assignment.services && (
                <Badge variant="secondary">
                  Service: {assignment.services.name}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(assignment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};