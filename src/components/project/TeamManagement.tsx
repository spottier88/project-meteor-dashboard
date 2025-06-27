
/**
 * @component TeamManagement
 * @description Gestion de l'équipe d'un projet.
 * Affiche la liste des membres, permet d'ajouter des membres existants,
 * d'inviter de nouveaux utilisateurs et de gérer les rôles des membres.
 * Les actions disponibles dépendent des permissions de l'utilisateur connecté.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, UserPlus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { TeamMemberForm } from "@/components/project/TeamMemberForm";
import { InviteMemberForm } from "@/components/project/InviteMemberForm";
import { TeamMembersTable } from "@/components/project/TeamMembersTable";
import { useTeamManagement } from "@/hooks/use-team-management";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

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
  
  const {
    project,
    members,
    handleDelete,
    handlePromoteToSecondaryManager,
    handleDemoteToMember
  } = useTeamManagement(projectId);

  // Fonction pour actualiser les données
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
    toast({
      title: "Actualisation",
      description: "Les données de l'équipe ont été actualisées.",
    });
  };

  // Wrapper pour passer les paramètres nécessaires avec vérifications supplémentaires
  const onPromoteMember = (memberId: string, roles: string[]) => {
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Invalid member ID for promotion:", memberId);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de promouvoir ce membre : identifiant invalide.",
      });
      return;
    }
    handlePromoteToSecondaryManager(memberId, roles, isAdmin);
  };

  const onDemoteMember = (memberId: string) => {
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Invalid member ID for demotion:", memberId);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de rétrograder ce membre : identifiant invalide.",
      });
      return;
    }
    handleDemoteToMember(memberId);
  };

  const onDeleteMember = (memberId: string, email?: string) => {
    if (!memberId || memberId === 'undefined' || memberId === 'null') {
      console.error("Invalid member ID for deletion:", memberId);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer ce membre : identifiant invalide.",
      });
      return;
    }
    handleDelete(memberId, email);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Équipe projet</h2>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          {canManageTeam && (
            <>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un membre
              </Button>
              <Button onClick={() => setIsInviteFormOpen(true)} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Inviter un utilisateur
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <TeamMembersTable
            members={members}
            project={project}
            canManageTeam={canManageTeam}
            onDeleteMember={onDeleteMember}
            onPromoteMember={onPromoteMember}
            onDemoteMember={onDemoteMember}
          />
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
