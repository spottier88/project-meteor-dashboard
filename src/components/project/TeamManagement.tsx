
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, UserPlus, ShieldCheck, CrownIcon, User } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          role,
          profiles (
            id,
            email,
            first_name,
            last_name,
            user_roles (
              role
            )
          )
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      
      return data.map(member => ({
        ...member,
        profiles: {
          ...member.profiles,
          roles: Array.isArray(member.profiles.user_roles) 
            ? member.profiles.user_roles.map((ur: any) => ur.role) 
            : []
        }
      }));
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
    onError: (error) => {
      console.error("Error deleting member:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du membre.",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string, role: string }) => {
      console.log(`Updating member ${memberId} to role ${role}`);
      const { data, error } = await supabase
        .from("project_members")
        .update({ role })
        .eq("id", memberId)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Update response:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      toast({
        title: "Rôle mis à jour",
        description: "Le rôle du membre a été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du rôle.",
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

  const handlePromoteToSecondaryManager = (memberId: string, roles: string[]) => {
    if (!roles.includes('chef_projet')) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: "Seuls les utilisateurs ayant le rôle 'Chef de projet' peuvent être promus.",
      });
      return;
    }

    updateRoleMutation.mutate({ memberId, role: 'secondary_manager' });
  };

  const handleDemoteToMember = (memberId: string) => {
    updateRoleMutation.mutate({ memberId, role: 'member' });
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
                const isSecondaryManager = member.role === 'secondary_manager';
                const userRoles = member.profiles?.roles || [];
                const isRegularMember = !isProjectManager && !isSecondaryManager;
                
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
                      {isSecondaryManager && (
                        <Badge variant="secondary" className="flex items-center">
                          <CrownIcon className="h-3 w-3 mr-1" />
                          Chef de projet secondaire
                        </Badge>
                      )}
                      {isRegularMember && (
                        <Badge variant="outline" className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Membre
                        </Badge>
                      )}
                    </TableCell>
                    {canManageTeam && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isProjectManager && !isSecondaryManager && userRoles.includes('chef_projet') && (
                              <DropdownMenuItem onClick={() => handlePromoteToSecondaryManager(member.id, userRoles)}>
                                Promouvoir chef de projet secondaire
                              </DropdownMenuItem>
                            )}
                            {!isProjectManager && isSecondaryManager && (
                              <DropdownMenuItem onClick={() => handleDemoteToMember(member.id)}>
                                Rétrograder au rôle de membre
                              </DropdownMenuItem>
                            )}
                            {!isProjectManager && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(member.id, member.profiles?.email)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Retirer de l'équipe
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
