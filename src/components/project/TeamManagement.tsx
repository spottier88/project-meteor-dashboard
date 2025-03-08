import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, UserPlus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { TeamMemberForm } from "@/components/project/TeamMemberForm";
import { InviteMemberForm } from "@/components/project/InviteMemberForm";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

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

  const handleDelete = (memberId: string, email?: string) => {
    if (email && project?.project_manager === email) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: "Vous ne pouvez pas retirer le chef de projet de l'équipe.",
      });
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?")) {
      deleteMutation.mutate(memberId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Équipe projet</h2>
        {canManageTeam && (
          <div className="flex space-x-2">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
            <Button onClick={() => setIsInviteFormOpen(true)} variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un utilisateur
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                {canManageTeam && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => {
                const isProjectManager = member.profiles?.email === project?.project_manager;
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.profiles && (member.profiles.first_name || member.profiles.last_name) 
                        ? `${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim()
                        : member.profiles?.email || 'Utilisateur inconnu'}
                    </TableCell>
                    <TableCell>{member.profiles?.email || 'Email non disponible'}</TableCell>
                    <TableCell>
                      {isProjectManager && (
                        <Badge variant="blue" className="flex items-center">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Chef de projet
                        </Badge>
                      )}
                    </TableCell>
                    {canManageTeam && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id, member.profiles?.email)}
                          disabled={isProjectManager}
                          title={isProjectManager ? "Le chef de projet ne peut pas être retiré de l'équipe" : "Retirer de l'équipe"}
                        >
                          <Trash2 className={`h-4 w-4 ${isProjectManager ? 'text-gray-400' : 'text-destructive'}`} />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {(!members || members.length === 0) && (
                <TableRow>
                  <TableCell colSpan={canManageTeam ? 4 : 3} className="text-center text-muted-foreground">
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

      <InviteMemberForm
        isOpen={isInviteFormOpen}
        onClose={() => setIsInviteFormOpen(false)}
        projectId={projectId}
        isProjectManager={isProjectManager}
        isAdmin={isAdmin}
      />
    </div>
  );
};
