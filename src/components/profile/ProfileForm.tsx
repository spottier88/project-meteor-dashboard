
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { EntityType } from "@/types/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserHierarchyAssignmentForm } from "./UserHierarchyAssignmentForm";

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
    case "membre":
      return "Membre";
    case "time_tracker":
      return "Suivi des activités";
    default:
      return role;
  }
};

export const ProfileForm = ({ isOpen, onClose, profile }: ProfileFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [refreshAssignments, setRefreshAssignments] = useState(0);

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

  const { data: hierarchyAssignments, refetch: refetchAssignments } = useQuery({
    queryKey: ["hierarchyAssignments", profile?.id, refreshAssignments],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data: assignments, error } = await supabase
        .from("user_hierarchy_assignments")
        .select("id, entity_type, entity_id")
        .eq("user_id", profile.id);

      if (error) throw error;

      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          let entityData;
          if (assignment.entity_type === 'pole') {
            const { data } = await supabase
              .from('poles')
              .select('name')
              .eq('id', assignment.entity_id)
              .single();
            entityData = data;
          } else if (assignment.entity_type === 'direction') {
            const { data } = await supabase
              .from('directions')
              .select('name')
              .eq('id', assignment.entity_id)
              .single();
            entityData = data;
          } else if (assignment.entity_type === 'service') {
            const { data } = await supabase
              .from('services')
              .select('name')
              .eq('id', assignment.entity_id)
              .single();
            entityData = data;
          }

          return {
            ...assignment,
            entity_name: entityData?.name || "Inconnu",
          };
        })
      );

      return enrichedAssignments;
    },
    enabled: !!profile?.id,
  });

  const handleSubmit = async () => {
    if (!profile) return;

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

  const handleAssignmentUpdate = () => {
    // Forcer le rechargement des affectations
    setRefreshAssignments(prev => prev + 1);
    
    // Invalider les requêtes de permissions pour forcer leur rechargement
    queryClient.invalidateQueries({ queryKey: ["userAccessibleOrganizations"] });
    queryClient.invalidateQueries({ queryKey: ["userRoles"] });
    
    // Invalider les données du contexte de permissions
    queryClient.invalidateQueries({ queryKey: ["accessibleOrganizations"] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mon profil</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="profile">Informations</TabsTrigger>
            <TabsTrigger value="assignment">Affectation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 mt-4">
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

            <Separator className="my-4" />
            
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
          </TabsContent>
          
          <TabsContent value="assignment" className="mt-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Gérer mon affectation hiérarchique</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Votre affectation hiérarchique détermine où vos projets apparaîtront dans l'organisation 
                et peut influer sur certaines fonctionnalités de l'application.
              </p>
              
              {hierarchyAssignments && hierarchyAssignments.length > 0 && (
                <div className="mb-4 p-3 bg-secondary/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Affectation actuelle</h4>
                  <div className="space-y-2">
                    {hierarchyAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center gap-2">
                        <Badge variant="outline">
                          {assignment.entity_type === 'pole' ? 'Pôle' : 
                           assignment.entity_type === 'direction' ? 'Direction' : 
                           assignment.entity_type === 'service' ? 'Service' : 
                           assignment.entity_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {assignment.entity_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {profile && (
                <UserHierarchyAssignmentForm 
                  userId={profile.id} 
                  onUpdate={handleAssignmentUpdate}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {activeTab === "profile" && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Mettre à jour"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
