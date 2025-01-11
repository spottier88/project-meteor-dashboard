import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { ManagerAssignment } from "@/types/user";

interface AssignmentsListProps {
  assignments: ManagerAssignment[];
  onAssignmentDelete: (assignmentId: string) => void;
}

export const AssignmentsList = ({ assignments, onAssignmentDelete }: AssignmentsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Affectations existantes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {assignments?.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex flex-wrap gap-2">
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
                onClick={() => onAssignmentDelete(assignment.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(!assignments || assignments.length === 0) && (
            <p className="text-muted-foreground text-center py-4">
              Aucune affectation
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};