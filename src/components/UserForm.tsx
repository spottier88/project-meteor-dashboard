import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserFormFields } from "./form/UserFormFields";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  user?: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    role: "admin" | "chef_projet";
  };
}

export const UserForm = ({ isOpen, onClose, onSubmit, user }: UserFormProps) => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState<"admin" | "chef_projet">(user?.role || "chef_projet");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            role,
          })
          .eq("id", user.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "L'utilisateur a été mis à jour",
        });
      } else {
        // Create new user
        const { error } = await supabase
          .from("profiles")
          .insert({
            id: crypto.randomUUID(),
            email,
            first_name: firstName,
            last_name: lastName,
            role,
          });

        if (error) throw error;

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
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Reset form when closing
        setFirstName("");
        setLastName("");
        setEmail("");
        setRole("chef_projet");
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </DialogTitle>
        </DialogHeader>
        <UserFormFields
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          role={role}
          setRole={setRole}
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