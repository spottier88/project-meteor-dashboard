import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, ShieldCheck, CrownIcon, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMemberProps {
  member: any;
  isProjectManager: boolean;
  isSecondaryManager: boolean;
  userRoles: string[];
  canManageTeam: boolean;
  onDelete: (id: string, email?: string) => void;
  onPromote: (id: string, roles: string[]) => void;
  onDemote: (id: string) => void;
}

export const TeamMemberRow = ({
  member,
  isProjectManager,
  isSecondaryManager,
  userRoles,
  canManageTeam,
  onDelete,
  onPromote,
  onDemote,
}: TeamMemberProps) => {
  return (
    <TableRow>
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
          <Badge variant="secondary" className="flex items-center bg-purple-200 text-purple-800 border-purple-200">
            <CrownIcon className="h-3 w-3 mr-1" />
            Chef de projet secondaire
          </Badge>
        )}
        {!isProjectManager && !isSecondaryManager && (
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
              {!isProjectManager && !isSecondaryManager && (
                <DropdownMenuItem onClick={() => onPromote(member.id, userRoles)}>
                  Promouvoir chef de projet secondaire
                </DropdownMenuItem>
              )}
              {!isProjectManager && isSecondaryManager && (
                <DropdownMenuItem onClick={() => onDemote(member.id)}>
                  Rétrograder au rôle de membre
                </DropdownMenuItem>
              )}
              {!isProjectManager && (
                <DropdownMenuItem 
                  onClick={() => onDelete(member.id, member.profiles?.email)}
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
};
