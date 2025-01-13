import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

const getRoleLabel = (role: string): string => {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "chef_projet":
      return "Chef de projet";
    case "manager":
      return "Manager";
    default:
      return role;
  }
};

const getEntityTypeLabel = (type: string): string => {
  switch (type) {
    case "pole":
      return "Pôle";
    case "direction":
      return "Direction";
    case "service":
      return "Service";
    default:
      return type;
  }
};

export const ProfileForm = ({ isOpen, onClose, profile }: ProfileFormProps) => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
    }
  }, [profile]);

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const isManager = userRoles?.some(role => role.role === "manager");

  const { data: managerAssignments } = useQuery({
    queryKey: ["managerAssignments", profile?.id],
    queryFn: async () => {
      if (!profile?.id || !isManager) return null;

      const { data: assignments, error } = await supabase
        .from("manager_assignments")
        .select(`
          id,
          entity_id,
          entity_type,
          poles (name),
          directions (name),
          services (name)
        `)
        .eq("user_id", profile.id);

      if (error) throw error;

      const detailedAssignments = assignments.map((assignment) => {
        let entityName = '';
        if (assignment.entity_type === 'pole' && assignment.poles) {
          entityName = assignment.poles.name;
        } else if (assignment.entity_type === 'direction' && assignment.directions) {
          entityName = assignment.directions.name;
        } else if (assignment.entity_type === 'service' && assignment.services) {
          entityName = assignment.services.name;
        }

        return {
          ...assignment,
          entity_name: entityName,
        };
      });

      return detailedAssignments;
    },
    enabled: !!profile?.id && isManager,
  });

  const handleSubmit = async () => {
    if (!profile?.id) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour",
      });
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil",
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
          <DialogTitle>Mon profil</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile?.email || ""}
              readOnly
              className="bg-gray-100"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <Separator className="my-2" />
          
          <div className="grid gap-2">
            <Label>Rôles</Label>
            <div className="flex flex-wrap gap-2">
              {userRoles?.map((role) => (
                <Badge key={role.id} variant="secondary">
                  {getRoleLabel(role.role)}
                </Badge>
              ))}
            </div>
          </div>

          {isManager && managerAssignments && managerAssignments.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="grid gap-2">
                <Label>Affectations</Label>
                <div className="space-y-2">
                  {managerAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getEntityTypeLabel(assignment.entity_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {assignment.entity_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Mettre à jour"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};