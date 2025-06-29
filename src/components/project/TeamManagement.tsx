

/**
 * @component TeamManagement
 * @description Gestion de l'équipe d'un projet.
 * Affiche la liste des membres, permet d'ajouter des membres existants,
 * d'inviter de nouveaux utilisateurs et de gérer les rôles des membres.
 * Les actions disponibles dépendent des permissions de l'utilisateur connecté.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { TeamMemberForm } from "@/components/project/TeamMemberForm";
import { InviteMemberForm } from "@/components/project/InviteMemberForm";
import { TeamMembersTable } from "@/components/project/TeamMembersTable";
import { useTeamManagement } from "@/hooks/use-team-management";

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
  
  const {
    project,
    members,
    handleDelete,
    handlePromoteToSecondaryManager,
    handleDemoteToMember
  } = useTeamManagement(projectId);

  // Log de diagnostic pour comparer les contextes
  console.log("🔍 TeamManagement - Diagnostic du contexte:", {
    projectId,
    canEdit,
    isProjectManager,
    isAdmin,
    canManageTeam,
    membersCount: members?.length || 0,
    component: "TeamManagement"
  });

  // Wrapper pour passer les paramètres nécessaires
  const onPromoteMember = (memberId: string, roles: string[]) => {
    handlePromoteToSecondaryManager(memberId, roles, isAdmin);
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
          <TeamMembersTable
            members={members}
            project={project}
            canManageTeam={canManageTeam}
            onDeleteMember={handleDelete}
            onPromoteMember={onPromoteMember}
            onDemoteMember={handleDemoteToMember}
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
