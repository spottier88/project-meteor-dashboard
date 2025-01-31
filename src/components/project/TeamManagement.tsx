import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { TeamMemberForm } from "@/components/project/TeamMemberForm";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TeamManagementProps {
  projectId: string;
  canEdit: boolean;
  isProjectManager: boolean;
  isAdmin: boolean;
  canManageTeam: boolean;
}

export const TeamManagement = ({
  projectId,
  canEdit,
  isProjectManager,
  isAdmin,
  canManageTeam,
}: TeamManagementProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: members } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          id,
          profiles (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      toast({
        title: "Membre supprimé",
        description: "Le membre a été retiré de l'équipe avec succès.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du membre.",
      });
    },
  });

  const handleDelete = (memberId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?")) {
      deleteMutation.mutate(memberId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Équipe projet</h2>
        {canManageTeam && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un membre
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                {canManageTeam && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.profiles.first_name} {member.profiles.last_name}
                  </TableCell>
                  <TableCell>{member.profiles.email}</TableCell>
                  {canManageTeam && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {(!members || members.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Aucun membre dans l'équipe
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TeamMemberForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};