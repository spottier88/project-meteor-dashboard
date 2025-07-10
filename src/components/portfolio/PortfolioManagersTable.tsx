
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Plus, Crown, User } from "lucide-react";
import { usePortfolioManagers, useRemovePortfolioManager, useUpdatePortfolioManagerRole, PortfolioManager } from "@/hooks/usePortfolioManagers";
import { usePortfolioPermissions } from "@/hooks/usePortfolioPermissions";
import { AddPortfolioManagerForm } from "./AddPortfolioManagerForm";

interface PortfolioManagersTableProps {
  portfolioId: string;
  portfolioOwnerId: string;
}

export const PortfolioManagersTable = ({ portfolioId, portfolioOwnerId }: PortfolioManagersTableProps) => {
  const { data: managers, isLoading } = usePortfolioManagers(portfolioId);
  const { canManagePortfolios } = usePortfolioPermissions();
  const removeManager = useRemovePortfolioManager();
  const updateRole = useUpdatePortfolioManagerRole();
  
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<string | null>(null);

  const formatUserName = (manager: PortfolioManager) => {
    if (manager.user_profile?.first_name || manager.user_profile?.last_name) {
      return `${manager.user_profile.first_name || ''} ${manager.user_profile.last_name || ''}`.trim();
    }
    return manager.user_profile?.email || 'Utilisateur inconnu';
  };

  const getRoleBadge = (role: string, isOwner: boolean) => {
    if (isOwner) {
      return (
        <Badge variant="default" className="gap-1">
          <Crown className="h-3 w-3" />
          Propriétaire
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="gap-1">
        <User className="h-3 w-3" />
        {role === 'manager' ? 'Gestionnaire' : role}
      </Badge>
    );
  };

  const handleRoleChange = (managerId: string, newRole: string) => {
    updateRole.mutate({ managerId, role: newRole });
  };

  const confirmDelete = () => {
    if (managerToDelete) {
      removeManager.mutate({ managerId: managerToDelete });
      setManagerToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Gestionnaires du portefeuille
            </CardTitle>
            {canManagePortfolios && (
              <Button 
                onClick={() => setIsAddFormOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un gestionnaire
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!managers || managers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun gestionnaire configuré
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  {canManagePortfolios && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((manager) => {
                  const isOwner = manager.user_id === portfolioOwnerId;
                  
                  return (
                    <TableRow key={manager.id}>
                      <TableCell className="font-medium">
                        {formatUserName(manager)}
                      </TableCell>
                      <TableCell>{manager.user_profile?.email}</TableCell>
                      <TableCell>
                        {canManagePortfolios && !isOwner ? (
                          <Select
                            value={manager.role}
                            onValueChange={(value) => handleRoleChange(manager.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">Gestionnaire</SelectItem>
                              <SelectItem value="viewer">Lecteur</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getRoleBadge(manager.role, isOwner)
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(manager.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      {canManagePortfolios && (
                        <TableCell>
                          {!isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setManagerToDelete(manager.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddPortfolioManagerForm
        portfolioId={portfolioId}
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
      />

      <AlertDialog open={!!managerToDelete} onOpenChange={() => setManagerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce gestionnaire ? Il perdra l'accès au portefeuille.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
