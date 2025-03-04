
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface InviteMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isProjectManager: boolean;
  isAdmin: boolean;
}

export const InviteMemberForm = ({
  isOpen,
  onClose,
  projectId,
  isProjectManager,
  isAdmin,
}: InviteMemberFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [existingUserId, setExistingUserId] = useState("");

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setUserExists(false);
    setExistingUserId("");
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (newEmail.includes('@')) {
      setIsChecking(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("email", newEmail)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUserExists(true);
          setExistingUserId(data.id);
          // Auto-remplir les champs prénom et nom si disponibles
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
        } else {
          setUserExists(false);
          setExistingUserId("");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'email:", error);
      } finally {
        setIsChecking(false);
      }
    }
  };

  const handleAddExistingUser = async () => {
    if (!existingUserId) return;

    setIsSubmitting(true);
    try {
      // Vérifier si l'utilisateur est déjà membre du projet
      const { data: existingMember } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", existingUserId)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Information",
          description: "Cet utilisateur est déjà membre du projet.",
        });
        onClose();
        return;
      }

      // Ajouter l'utilisateur au projet
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: existingUserId,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'utilisateur a été ajouté à l'équipe avec succès.",
      });

      // Rafraîchir la liste des membres
      queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Erreur d'ajout:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async () => {
    if (!email) {
      toast({
        title: "Erreur",
        description: "L'email est requis",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role: "membre", // Toujours attribuer le rôle membre
          projectId: projectId // Ajouter l'ID du projet pour l'ajout automatique
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: `Une invitation a été envoyée à ${email}`,
      });

      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Erreur d'invitation:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de l'invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userExists) {
      handleAddExistingUser();
    } else {
      handleInviteUser();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {userExists ? "Ajouter un utilisateur existant" : "Inviter un nouvel utilisateur"}
          </DialogTitle>
          <DialogDescription>
            {userExists 
              ? "Cet utilisateur existe déjà. Vous pouvez l'ajouter directement à l'équipe du projet."
              : "Envoyez une invitation par email pour créer un compte et ajouter l'utilisateur à l'équipe."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="email@exemple.fr"
                  required
                  className={userExists ? "border-green-500 pr-10" : ""}
                />
                {isChecking && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {userExists && (
                <p className="text-sm text-green-600">
                  Utilisateur trouvé ! Vous pouvez l'ajouter directement à l'équipe.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom"
                  disabled={userExists}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom"
                  disabled={userExists}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {userExists ? "Ajout en cours..." : "Envoi en cours..."}
                </>
              ) : (
                userExists ? "Ajouter à l'équipe" : "Envoyer l'invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
