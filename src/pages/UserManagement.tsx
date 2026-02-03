import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Plus, Settings, Trash2, Users, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserForm } from "@/components/UserForm";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { UserProfile, UserRole, UserRoleData } from "@/types/user";
import { SortableHeader, SortDirection } from "@/components/ui/sortable-header";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserWithRoles extends UserProfile {
  roles: UserRole[];
  lastActivity?: Date;
  hasManagerAssignment?: boolean;
}

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "chef_projet":
      return "Chef de projet";
    case "manager":
      return "Manager";
    case "membre":
      return "Membre";
    case "time_tracker":
      return "Suivi activités";
    case "portfolio_manager":
      return "Gestionnaire de portefeuille";
    case "quality_manager":
      return "Responsable Qualité";
    default:
      return role;
  }
};

export const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const { data: lastActivities } = useQuery({
    queryKey: ["lastActivities"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_last_activity");
      if (error) throw error;
      return data.reduce((acc: Record<string, Date>, curr: { user_id: string, last_activity_at: string }) => {
        acc[curr.user_id] = new Date(curr.last_activity_at);
        return acc;
      }, {});
    },
  });

  const { data: managerAssignments } = useQuery({
    queryKey: ["managerAssignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_path_assignments")
        .select("user_id");
      
      if (error) throw error;
      
      const assignmentSet = new Set(data.map(assignment => assignment.user_id));
      console.log("Manager assignments:", assignmentSet);
      return assignmentSet;
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles = (profilesData as UserProfile[]).map(profile => {
        const userRoles = rolesData
          .filter((role: UserRoleData) => role.user_id === profile.id)
          .map((role: UserRoleData) => role.role);
        
        const hasManagerRole = userRoles.includes("manager");
        const hasAssignment = hasManagerRole ? managerAssignments?.has(profile.id) || false : false;
        
        if (hasManagerRole) {
          console.log(`User ${profile.email} has manager role. Has assignment: ${hasAssignment}`);
        }

        return {
          ...profile,
          roles: userRoles,
          lastActivity: lastActivities?.[profile.id],
          hasManagerAssignment: hasAssignment
        };
      });
      
      return usersWithRoles;
    },
    enabled: !!lastActivities && !!managerAssignments,
  });

  const handleEdit = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'utilisateur a été supprimé",
      });

      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["lastActivities"] });
      queryClient.invalidateQueries({ queryKey: ["managerAssignments"] });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
    }
  };

  const handleFormSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["lastActivities"] });
    queryClient.invalidateQueries({ queryKey: ["managerAssignments"] });
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const formatLastActivity = (date?: Date) => {
    if (!date) return "Aucune activité";
    return date.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  let filteredUsers = users?.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const firstName = user.first_name?.toLowerCase() || "";
    const lastName = user.last_name?.toLowerCase() || "";
    const email = user.email?.toLowerCase() || "";
    return firstName.includes(searchLower) || lastName.includes(searchLower) || email.includes(searchLower);
  }) || [];

  if (sortKey && sortDirection) {
    filteredUsers = [...filteredUsers].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortKey) {
        case "email":
          valueA = a.email || "";
          valueB = b.email || "";
          break;
        case "first_name":
          valueA = a.first_name || "";
          valueB = b.first_name || "";
          break;
        case "last_name":
          valueA = a.last_name || "";
          valueB = b.last_name || "";
          break;
        case "roles":
          valueA = a.roles.join(",");
          valueB = b.roles.join(",");
          break;
        case "lastActivity":
          valueA = a.lastActivity ? a.lastActivity.getTime() : 0;
          valueB = b.lastActivity ? b.lastActivity.getTime() : 0;
          break;
        default:
          valueA = a[sortKey as keyof typeof a] || "";
          valueB = b[sortKey as keyof typeof b] || "";
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestion des Utilisateurs
            </h1>
            <p className="text-muted-foreground">
              Gérez les utilisateurs et leurs rôles
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setIsInviteFormOpen(true)} variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Inviter par email
            </Button>
            <Button onClick={() => {
              setSelectedUser(null);
              setIsFormOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Rechercher par nom, prénom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader
              label="Email"
              sortKey="email"
              currentSort={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Prénom"
              sortKey="first_name"
              currentSort={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Nom"
              sortKey="last_name"
              currentSort={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Rôles"
              sortKey="roles"
              currentSort={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Dernière activité"
              sortKey="lastActivity"
              currentSort={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.first_name || "-"}</TableCell>
              <TableCell>{user.last_name || "-"}</TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  {[...new Set(user.roles)].map((role) => (
                    role === "manager" ? (
                      <div key={role} className="flex items-center gap-1">
                        <Badge variant="secondary">
                          {getRoleLabel(role)}
                        </Badge>
                        {!user.hasManagerAssignment && (
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
                    ) : (
                      <Badge key={role} variant="secondary">
                        {getRoleLabel(role)}
                      </Badge>
                    )
                  ))}
                </div>
              </TableCell>
              <TableCell>{formatLastActivity(user.lastActivity)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(user)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {user.roles.includes("manager") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/admin/users/${user.id}/assignments`)}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUserToDelete(user)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
      />

      <InviteUserForm
        isOpen={isInviteFormOpen}
        onClose={() => setIsInviteFormOpen(false)}
        onSuccess={handleFormSubmit}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. L'utilisateur sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
