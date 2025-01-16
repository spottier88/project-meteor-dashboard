import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserFormFields } from "./form/UserFormFields";
import { UserRole } from "@/types/user";
import { HierarchyAssignmentFields } from "./form/HierarchyAssignmentFields";
import { HierarchyAssignment } from "@/types/user";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  user?: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    roles: UserRole[];
  };
}

export const UserForm = ({ isOpen, onClose, onSubmit, user }: UserFormProps) => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [roles, setRoles] = useState<UserRole[]>(user?.roles || ["chef_projet"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [hierarchyAssignment, setHierarchyAssignment] = useState<Omit<HierarchyAssignment, 'id' | 'created_at'> | null>(null);
  const [existingUsers, setExistingUsers] = useState<Array<{ id: string; email: string; }>>([]);

  const fetchExistingUsers = async () => {
    const { data, error } = await supabase.rpc('get_users_without_profile');
    if (!error && data) {
      setExistingUsers(data);
    }
  };

  const handleExistingUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = existingUsers.find(u => u.id === userId);
    if (selectedUser) {
      setEmail(selectedUser.email);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setRoles(user.roles);
      setSelectedUserId("");
      
      // Charger l'affectation hiérarchique existante
      const loadHierarchyAssignment = async () => {
        const { data, error } = await supabase
          .from("user_hierarchy_assignments")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          setHierarchyAssignment({
            user_id: data.user_id,
            entity_id: data.entity_id,
            entity_type: data.entity_type
          });
        }
      };

      loadHierarchyAssignment();
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setRoles(["chef_projet"]);
      setSelectedUserId("");
      setHierarchyAssignment(null);
      fetchExistingUsers();
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!email || !firstName || !lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (user) {
        // Update existing user
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // Get current roles to compare
        const { data: currentRoles, error: getRolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (getRolesError) throw getRolesError;

        const currentRoleSet = new Set(currentRoles.map(r => r.role));
        const newRoleSet = new Set(roles);

        // Roles to remove (in current but not in new)
        const rolesToRemove = currentRoles
          .map(r => r.role)
          .filter(role => !newRoleSet.has(role));

        // Roles to add (in new but not in current)
        const rolesToAdd = roles.filter(role => !currentRoleSet.has(role));

        // Remove roles that are no longer needed
        if (rolesToRemove.length > 0) {
          const { error: deleteRolesError } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", user.id)
            .in("role", rolesToRemove);

          if (deleteRolesError) throw deleteRolesError;
        }

        // Add new roles
        if (rolesToAdd.length > 0) {
          const { error: insertRolesError } = await supabase
            .from("user_roles")
            .insert(
              rolesToAdd.map(role => ({
                user_id: user.id,
                role: role,
              }))
            );

          if (insertRolesError) throw insertRolesError;
        }

        // Update hierarchy assignment if provided
        if (hierarchyAssignment) {
          // Delete existing assignment if any
          await supabase
            .from("user_hierarchy_assignments")
            .delete()
            .eq("user_id", user.id);

          // Insert new assignment
          const { error: hierarchyError } = await supabase
            .from("user_hierarchy_assignments")
            .insert({
              user_id: user.id,
              entity_id: hierarchyAssignment.entity_id,
              entity_type: hierarchyAssignment.entity_type
            });

          if (hierarchyError) throw hierarchyError;
        }

        toast({
          title: "Succès",
          description: "L'utilisateur a été mis à jour",
        });
      } else {
        const userId = selectedUserId || crypto.randomUUID();
        
        // Create profile for existing or new user
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
          });

        if (profileError) throw profileError;

        // Add roles for the user
        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(
            roles.map(role => ({
              user_id: userId,
              role: role,
            }))
          );

        if (rolesError) throw rolesError;

        // Add hierarchy assignment if provided
        if (hierarchyAssignment) {
          const { error: hierarchyError } = await supabase
            .from("user_hierarchy_assignments")
            .insert({
              user_id: userId,
              entity_id: hierarchyAssignment.entity_id,
              entity_type: hierarchyAssignment.entity_type
            });

          if (hierarchyError) throw hierarchyError;
        }

        toast({
          title: "Succès",
          description: "L'utilisateur a été créé",
        });
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création/modification de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? "Modifiez les informations de l'utilisateur ci-dessous."
              : "Remplissez les informations pour créer un nouvel utilisateur."}
          </DialogDescription>
        </DialogHeader>
        <UserFormFields
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          roles={roles}
          setRoles={setRoles}
          isEditMode={!!user}
          existingUsers={existingUsers}
          selectedUserId={selectedUserId}
          onExistingUserSelect={handleExistingUserSelect}
        />
        <HierarchyAssignmentFields
          userId={user?.id || selectedUserId}
          onAssignmentChange={setHierarchyAssignment}
          initialAssignment={hierarchyAssignment}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : user ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
