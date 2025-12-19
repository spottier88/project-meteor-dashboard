/**
 * @component OnboardingProfileStep
 * @description Étape de complétion du profil intégrée au tutoriel d'onboarding.
 * Permet aux nouveaux utilisateurs de renseigner leur nom, prénom et affectation
 * directement dans le carousel de prise en main.
 */

import { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { User, Building2, CheckCircle2 } from "lucide-react";

interface OnboardingProfileStepProps {
  onValidityChange: (isValid: boolean) => void;
  onProfileSaved: () => void;
}

/**
 * Formulaire simplifié de profil pour l'onboarding.
 * Valide automatiquement si tous les champs obligatoires sont remplis.
 */
export const OnboardingProfileStep = ({ 
  onValidityChange,
  onProfileSaved 
}: OnboardingProfileStepProps) => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États du formulaire
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedPole, setSelectedPole] = useState<string>("none");
  const [selectedDirection, setSelectedDirection] = useState<string>("none");
  const [selectedService, setSelectedService] = useState<string>("none");
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Récupération du profil existant
  const { data: profile } = useQuery({
    queryKey: ["userProfileOnboarding", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Récupération des pôles
  const { data: poles = [] } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("poles").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Récupération des directions (filtrées par pôle)
  const { data: directions = [] } = useQuery({
    queryKey: ["directions", selectedPole],
    queryFn: async () => {
      if (!selectedPole || selectedPole === "none") return [];
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", selectedPole)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPole && selectedPole !== "none",
  });

  // Récupération des services (filtrés par direction)
  const { data: services = [] } = useQuery({
    queryKey: ["services", selectedDirection],
    queryFn: async () => {
      if (!selectedDirection || selectedDirection === "none") return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", selectedDirection)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDirection && selectedDirection !== "none",
  });

  // Pré-remplir les champs si le profil existe
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
    }
  }, [profile]);

  // Vérifier si le formulaire est valide
  const hasHierarchy = selectedPole !== "none" || selectedDirection !== "none" || selectedService !== "none";
  const isFormValid = firstName.trim() !== "" && lastName.trim() !== "" && hasHierarchy;

  // Notifier le parent de la validité du formulaire
  useEffect(() => {
    onValidityChange(isFormValid || hasSaved);
  }, [isFormValid, hasSaved, onValidityChange]);

  // Gérer le changement de pôle
  const handlePoleChange = (value: string) => {
    setSelectedPole(value);
    setSelectedDirection("none");
    setSelectedService("none");
  };

  // Gérer le changement de direction
  const handleDirectionChange = (value: string) => {
    setSelectedDirection(value);
    setSelectedService("none");
  };

  // Sauvegarder le profil
  const handleSave = async () => {
    if (!user?.id || !isFormValid) return;

    setIsSaving(true);
    try {
      // Mise à jour du profil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Déterminer l'entité à affecter (la plus précise disponible)
      let entityId: string | null = null;
      let entityType: "pole" | "direction" | "service" | null = null;

      if (selectedService && selectedService !== "none") {
        entityId = selectedService;
        entityType = "service";
      } else if (selectedDirection && selectedDirection !== "none") {
        entityId = selectedDirection;
        entityType = "direction";
      } else if (selectedPole && selectedPole !== "none") {
        entityId = selectedPole;
        entityType = "pole";
      }

      if (entityId && entityType) {
        // Supprimer l'ancienne affectation si elle existe
        await supabase
          .from("user_hierarchy_assignments")
          .delete()
          .eq("user_id", user.id);

        // Créer la nouvelle affectation
        const { error: assignmentError } = await supabase
          .from("user_hierarchy_assignments")
          .insert({
            user_id: user.id,
            entity_id: entityId,
            entity_type: entityType,
          });

        if (assignmentError) throw assignmentError;
      }

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userHierarchyAssignment"] });
      queryClient.invalidateQueries({ queryKey: ["hierarchyAssignments"] });

      setHasSaved(true);
      onProfileSaved();
      
      toast({
        title: "Profil enregistré",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 py-4">
      {/* En-tête */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <User className="h-8 w-8 text-primary" />
      </div>
      
      <h2 className="text-xl font-bold mb-2 text-foreground text-center">
        Complétez votre profil
      </h2>
      
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
        Ces informations nous aident à personnaliser votre expérience et à organiser vos projets.
      </p>

      {/* Formulaire */}
      <div className="w-full max-w-md space-y-4">
        {/* Nom et Prénom */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="onboarding-firstname" className="text-sm">
              Prénom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="onboarding-firstname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboarding-lastname" className="text-sm">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="onboarding-lastname"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Affectation hiérarchique */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">
              Affectation <span className="text-destructive">*</span>
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Sélectionnez au moins un niveau (Pôle, Direction ou Service)
          </p>
          
          {/* Sélection du pôle */}
          <Select value={selectedPole} onValueChange={handlePoleChange} disabled={isSaving}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un pôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {poles.map((pole) => (
                <SelectItem key={pole.id} value={pole.id}>{pole.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sélection de la direction */}
          <Select 
            value={selectedDirection} 
            onValueChange={handleDirectionChange}
            disabled={isSaving || selectedPole === "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              {directions.map((direction) => (
                <SelectItem key={direction.id} value={direction.id}>{direction.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sélection du service */}
          <Select 
            value={selectedService} 
            onValueChange={setSelectedService}
            disabled={isSaving || selectedDirection === "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bouton de sauvegarde */}
        {hasSaved ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-lg text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Profil enregistré !</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer mon profil"}
          </button>
        )}
      </div>
    </div>
  );
};
