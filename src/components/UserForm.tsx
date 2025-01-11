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

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setRoles(user.roles);
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setRoles(["chef_projet"]);
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

        toast({
          title: "Succès",
          description: "L'utilisateur a été mis à jour",
        });
      } else {
        // Create new user with profile and generate UUID
        const newUserId = crypto.randomUUID();
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: newUserId,
            email,
            first_name: firstName,
            last_name: lastName,
          });

        if (profileError) throw profileError;

        // Add roles for the new user
        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(
            roles.map(role => ({
              user_id: newUserId,
              role: role,
            }))
          );

        if (rolesError) throw rolesError;

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
      <DialogContent className="sm:max-w-[425px]">
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