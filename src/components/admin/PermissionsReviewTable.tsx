/**
 * Tableau consolidé de la revue des droits.
 * Affiche utilisateurs, rôles, affectations hiérarchiques et dernière activité.
 */
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserRole } from "@/types/user";

/** Données consolidées d'un utilisateur pour la revue */
export interface PermissionsReviewUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  roles: UserRole[];
  /** Chemins hiérarchiques pour les managers */
  hierarchyPaths: string[];
  lastActivity?: Date;
}

/** Labels lisibles pour chaque rôle */
const getRoleLabel = (role: UserRole): string => {
  const labels: Record<string, string> = {
    admin: "Administrateur",
    chef_projet: "Chef de projet",
    manager: "Manager",
    membre: "Membre",
    time_tracker: "Suivi activités",
    portfolio_manager: "Gestionnaire de portefeuille",
    quality_manager: "Responsable Qualité",
  };
  return labels[role] || role;
};

/** Formatage de la dernière activité */
const formatLastActivity = (date?: Date) => {
  if (!date) return "Aucune activité";
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
};

interface PermissionsReviewTableProps {
  users: PermissionsReviewUser[];
}

export const PermissionsReviewTable = ({ users }: PermissionsReviewTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Prénom</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rôles</TableHead>
          <TableHead>Affectations hiérarchiques</TableHead>
          <TableHead>Dernière activité</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              Aucun utilisateur ne correspond aux filtres.
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => {
            const isManager = user.roles.includes("manager");
            const hasNoAssignment = isManager && user.hierarchyPaths.length === 0;

            return (
              <TableRow key={user.id}>
                <TableCell>{user.last_name || "-"}</TableCell>
                <TableCell>{user.first_name || "-"}</TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {[...new Set(user.roles)].map((role) => (
                      <div key={role} className="flex items-center gap-1">
                        <Badge variant="secondary">{getRoleLabel(role)}</Badge>
                        {role === "manager" && hasNoAssignment && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="warning" className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs">Non affecté</span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ce manager n'a pas d'affectation hiérarchique</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {isManager ? (
                    user.hierarchyPaths.length > 0 ? (
                      <div className="space-y-1">
                        {user.hierarchyPaths.map((path, i) => (
                          <div key={i} className="text-sm">{path}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">(aucune)</span>
                    )
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatLastActivity(user.lastActivity)}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
