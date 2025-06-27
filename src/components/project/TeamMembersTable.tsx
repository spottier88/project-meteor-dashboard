
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

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
  // Vérification de la cohérence des données
  const validMembers = members?.filter(member => {
    const hasValidId = member?.id && member.id !== 'undefined' && member.id !== 'null';
    if (!hasValidId) {
      console.warn("Invalid member found:", member);
    }
    return hasValidId;
  }) || [];

  const invalidMembersCount = (members?.length || 0) - validMembers.length;

  return (
    <div className="space-y-4">
      {invalidMembersCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {invalidMembersCount} membre(s) avec des données incohérentes détecté(s). 
            Veuillez actualiser la page ou contacter l'administrateur.
          </AlertDescription>
        </Alert>
      )}
      
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
          {validMembers.map((member) => {
            const isProjectManager = member.profiles?.email === project?.project_manager;
            const isSecondaryManager = member.role === 'secondary_manager';
            const userRoles = member.profiles?.roles || [];
            
            return (
              <TeamMemberRow
                key={member.id}
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
          {validMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={canManageTeam ? 4 : 3} className="text-center text-muted-foreground">
                Aucun membre dans l'équipe
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
