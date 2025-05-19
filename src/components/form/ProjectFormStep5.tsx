
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { ForEntityType } from "@/types/project";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

interface ProjectFormStep5Props {
  forEntityType: ForEntityType;
  setForEntityType: (value: ForEntityType) => void;
  forEntityId: string | undefined;
  setForEntityId: (value: string | undefined) => void;
}

export const ProjectFormStep5 = ({
  forEntityType,
  setForEntityType,
  forEntityId,
  setForEntityId,
}: ProjectFormStep5Props) => {
  // États pour gérer la sélection hiérarchique
  const [selectedPoleId, setSelectedPoleId] = useState<string | undefined>(undefined);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | undefined>(undefined);
  
  // Chargement des pôles - toujours activé
  const { data: poles, isLoading: isLoadingPoles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Chargement des directions en fonction du pôle sélectionné
  const { data: directions, isLoading: isLoadingDirections } = useQuery({
    queryKey: ["directions", selectedPoleId],
    queryFn: async () => {
      if (!selectedPoleId) return [];
      
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", selectedPoleId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPoleId, // Activé uniquement si un pôle est sélectionné
  });

  // Chargement des services en fonction de la direction sélectionnée
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", selectedDirectionId],
    queryFn: async () => {
      if (!selectedDirectionId) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", selectedDirectionId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDirectionId, // Activé uniquement si une direction est sélectionnée
  });
  
  // Réinitialisation des sélections quand le type d'entité change
  useEffect(() => {
    if (forEntityType === null) {
      setForEntityId(undefined);
      setSelectedPoleId(undefined);
      setSelectedDirectionId(undefined);
    }
  }, [forEntityType, setForEntityId]);
  
  // Récupération de la hiérarchie lors du chargement initial d'un projet existant
  useEffect(() => {
    const loadInitialHierarchy = async () => {
      // Seulement exécuter au chargement initial avec un forEntityId défini
      if (!forEntityId || !forEntityType) return;
      
      try {
        if (forEntityType === "pole") {
          // Pour un pôle, c'est simple
          setSelectedPoleId(forEntityId);
        }
        else if (forEntityType === "direction") {
          // Pour une direction, on charge son pôle parent
          const { data: direction } = await supabase
            .from("directions")
            .select("pole_id")
            .eq("id", forEntityId)
            .single();
          
          if (direction) {
            setSelectedPoleId(direction.pole_id);
          }
        }
        else if (forEntityType === "service") {
          // Pour un service, on charge sa direction parente et le pôle parent
          const { data: service } = await supabase
            .from("services")
            .select("direction_id")
            .eq("id", forEntityId)
            .single();
          
          if (service) {
            setSelectedDirectionId(service.direction_id);
            
            // Ensuite on charge le pôle parent de cette direction
            const { data: direction } = await supabase
              .from("directions")
              .select("pole_id")
              .eq("id", service.direction_id)
              .single();
            
            if (direction) {
              setSelectedPoleId(direction.pole_id);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la hiérarchie initiale:", error);
      }
    };
    
    loadInitialHierarchy();
  }, [forEntityId, forEntityType]); // Exécuté uniquement quand ces valeurs changent

  // Gestion du changement de type d'entité
  const handleEntityTypeChange = (value: string) => {
    setForEntityType(value === "null" ? null : value as ForEntityType);
    setForEntityId(undefined);
    setSelectedPoleId(undefined);
    setSelectedDirectionId(undefined);
  };
  
  // Rendu des sélecteurs en fonction du type d'entité
  const renderEntitySelector = () => {
    if (!forEntityType) return null;
    
    // Affiche un squelette pendant le chargement initial des données
    if (isLoadingPoles) {
      return <Skeleton className="h-10 w-full" />;
    }
    
    switch (forEntityType) {
      case "pole":
        return (
          <div className="grid gap-2">
            <Label htmlFor="pole-selector">Sélectionner un pôle</Label>
            <Select
              value={forEntityId}
              onValueChange={setForEntityId}
            >
              <SelectTrigger id="pole-selector">
                <SelectValue placeholder="Choisir un pôle" />
              </SelectTrigger>
              <SelectContent>
                {poles?.map((pole) => (
                  <SelectItem key={pole.id} value={pole.id}>
                    {pole.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      case "direction":
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pole-selector">Sélectionner un pôle</Label>
              <Select
                value={selectedPoleId}
                onValueChange={(value) => {
                  setSelectedPoleId(value);
                  setForEntityId(undefined);
                }}
              >
                <SelectTrigger id="pole-selector">
                  <SelectValue placeholder="Choisir un pôle" />
                </SelectTrigger>
                <SelectContent>
                  {poles?.map((pole) => (
                    <SelectItem key={pole.id} value={pole.id}>
                      {pole.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPoleId && !isLoadingDirections && (
              <div className="grid gap-2">
                <Label htmlFor="direction-selector">Sélectionner une direction</Label>
                <Select
                  value={forEntityId}
                  onValueChange={setForEntityId}
                >
                  <SelectTrigger id="direction-selector">
                    <SelectValue placeholder="Choisir une direction" />
                  </SelectTrigger>
                  <SelectContent>
                    {directions?.map((direction) => (
                      <SelectItem key={direction.id} value={direction.id}>
                        {direction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedPoleId && isLoadingDirections && (
              <Skeleton className="h-10 w-full" />
            )}
          </div>
        );
        
      case "service":
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pole-selector">Sélectionner un pôle</Label>
              <Select
                value={selectedPoleId}
                onValueChange={(value) => {
                  setSelectedPoleId(value);
                  setSelectedDirectionId(undefined);
                  setForEntityId(undefined);
                }}
              >
                <SelectTrigger id="pole-selector">
                  <SelectValue placeholder="Choisir un pôle" />
                </SelectTrigger>
                <SelectContent>
                  {poles?.map((pole) => (
                    <SelectItem key={pole.id} value={pole.id}>
                      {pole.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPoleId && !isLoadingDirections && (
              <div className="grid gap-2">
                <Label htmlFor="direction-selector">Sélectionner une direction</Label>
                <Select
                  value={selectedDirectionId}
                  onValueChange={(value) => {
                    setSelectedDirectionId(value);
                    setForEntityId(undefined);
                  }}
                >
                  <SelectTrigger id="direction-selector">
                    <SelectValue placeholder="Choisir une direction" />
                  </SelectTrigger>
                  <SelectContent>
                    {directions?.map((direction) => (
                      <SelectItem key={direction.id} value={direction.id}>
                        {direction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedPoleId && isLoadingDirections && (
              <Skeleton className="h-10 w-full" />
            )}
            
            {selectedDirectionId && !isLoadingServices && (
              <div className="grid gap-2">
                <Label htmlFor="service-selector">Sélectionner un service</Label>
                <Select
                  value={forEntityId}
                  onValueChange={setForEntityId}
                >
                  <SelectTrigger id="service-selector">
                    <SelectValue placeholder="Choisir un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedDirectionId && isLoadingServices && (
              <Skeleton className="h-10 w-full" />
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Informations complémentaires</h2>
      
      <div className="grid gap-2">
        <Label htmlFor="for-entity-type">Projet réalisé pour</Label>
        <Select
          value={forEntityType || "null"}
          onValueChange={handleEntityTypeChange}
        >
          <SelectTrigger id="for-entity-type">
            <SelectValue placeholder="Sélectionner un type d'entité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Aucune entité spécifique</SelectItem>
            <SelectItem value="pole">Pôle</SelectItem>
            <SelectItem value="direction">Direction</SelectItem>
            <SelectItem value="service">Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {forEntityType && renderEntitySelector()}
    </div>
  );
};
