
/**
 * @component TeamMembersTable
 * @description Tableau des membres de l'équipe d'un projet.
 * Affiche la liste des membres avec leur nom, email et rôle.
 * Permet de gérer les membres (suppression, promotion, rétrogradation)
 * si l'utilisateur en a les droits.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamMemberRow } from "@/components/project/TeamMemberRow";

interface TeamMembersTableProps {
  members: any[] | undefined;
  project: any;
  canManageTeam: boolean;
  onDeleteMember: (id: string, email?: string) => void;
  onPromoteMember: (id: string, roles: string[]) => void;
  onDemoteMember: (id: string) => void;
}

export const TeamMembersTable = ({
  members,
  project,
  canManageTeam,
  onDeleteMember,
  onPromoteMember,
  onDemoteMember,
}: TeamMembersTableProps) => {
  return (
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
        {members?.map((member, index) => {
          const isProjectManager = member.profiles?.email === project?.project_manager;
          const isSecondaryManager = member.role === 'secondary_manager';
          const userRoles = member.profiles?.roles || [];
          
          // Utiliser une clé composite pour éviter les doublons et les clés manquantes
          const uniqueKey = member.id || `${member.user_id || 'unknown'}-${index}`;
          
          return (
            <TeamMemberRow
              key={uniqueKey}
              member={member}
              isProjectManager={isProjectManager}
              isSecondaryManager={isSecondaryManager}
              userRoles={userRoles}
              canManageTeam={canManageTeam}
              onDelete={onDeleteMember}
              onPromote={onPromoteMember}
              onDemote={onDemoteMember}
            />
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
  );
};
