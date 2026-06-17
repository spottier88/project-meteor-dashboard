
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
import { useTeamManagement } from "@/hooks/useTeamManagement";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectManagerInfo {
  project_manager?: string | null;
}

interface TeamMember {
  id: string;
  user_id?: string;
  role?: string;
  project_id?: string;
  profiles?: {
    id?: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    roles?: string[];
  } | null;
}

export interface TeamManagementProps {
  projectId: string;
  permissions: {
    canEdit: boolean;
    isProjectManager: boolean;
    isAdmin: boolean;
    canManageTeam: boolean;
  };
  preloadedData?: {
    project: ProjectManagerInfo | null | undefined;
    members: TeamMember[];
    handleDelete: (id: string, email?: string) => void;
    handlePromoteToSecondaryManager: (id: string, roles: string[], isAdmin: boolean) => void;
    handleDemoteToMember: (id: string) => void;
  };
}

export const TeamManagement = ({
  projectId,
  permissions,
  preloadedData,
}: TeamManagementProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  // F-05 : confirmation via AlertDialog Radix plutôt que window.confirm
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; email?: string } | null>(null);
  
  // Utiliser les données préchargées si disponibles, sinon charger via le hook
  const hookData = useTeamManagement(projectId, permissions, !preloadedData);
  
  const teamData = preloadedData || hookData;
  const {
    project,
    members,
    handleDelete,
    handlePromoteToSecondaryManager,
    handleDemoteToMember
  } = teamData;

  // Wrapper pour passer les paramètres nécessaires
  const onPromoteMember = (memberId: string, roles: string[]) => {
    handlePromoteToSecondaryManager(memberId, roles, permissions.isAdmin);
  };

  // Ouverture de la confirmation : on bloque déjà côté UI si c'est le chef de projet.
  const onRequestDeleteMember = (memberId: string, email?: string) => {
    if (email && project?.project_manager === email) {
      // On laisse handleDelete gérer le toast d'erreur (logique métier centralisée)
      handleDelete(memberId, email);
      return;
    }
    setMemberToDelete({ id: memberId, email });
  };

  const onConfirmDeleteMember = () => {
    if (memberToDelete) {
      handleDelete(memberToDelete.id, memberToDelete.email);
    }
    setMemberToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Équipe projet</h2>
        {permissions.canManageTeam && (
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
            canManageTeam={permissions.canManageTeam}
            onDeleteMember={onRequestDeleteMember}
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
        isProjectManager={permissions.isProjectManager}
        isAdmin={permissions.isAdmin}
      />

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retire le membre de l'équipe du projet. Elle peut être annulée
              en l'ajoutant à nouveau ultérieurement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDeleteMember}>Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
