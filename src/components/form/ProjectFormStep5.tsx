
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
  
  // Charger les pôles
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

  // Charger les directions en fonction du pôle sélectionné
  const { data: directions, isLoading: isLoadingDirections } = useQuery({
    queryKey: ["directions", selectedPoleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .eq("pole_id", selectedPoleId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPoleId && forEntityType !== "pole",
  });

  // Charger les services en fonction de la direction sélectionnée
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", selectedDirectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("direction_id", selectedDirectionId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDirectionId && forEntityType === "service",
  });
  
  // À l'initialisation ou quand le type d'entité change, réinitialiser l'ID de l'entité
  useEffect(() => {
    if (forEntityType === null) {
      setForEntityId(undefined);
      setSelectedPoleId(undefined);
      setSelectedDirectionId(undefined);
    }
  }, [forEntityType, setForEntityId]);
  
  // Retrouver la hiérarchie complète pour une entité sélectionnée au chargement initial
  useEffect(() => {
    const loadHierarchy = async () => {
      if (forEntityId && forEntityType) {
        try {
          if (forEntityType === "service" && services) {
            // Trouver le service
            const service = services.find(s => s.id === forEntityId);
            if (service) {
              setSelectedDirectionId(service.direction_id);
              
              // Trouver le pôle parent de la direction
              const { data: direction } = await supabase
                .from("directions")
                .select("pole_id")
                .eq("id", service.direction_id)
                .single();
                
              if (direction) {
                setSelectedPoleId(direction.pole_id);
              }
            }
          } else if (forEntityType === "direction" && directions) {
            // Trouver la direction
            const direction = directions.find(d => d.id === forEntityId);
            if (direction) {
              setSelectedPoleId(direction.pole_id);
            }
          } else if (forEntityType === "pole") {
            setSelectedPoleId(forEntityId);
          }
        } catch (error) {
          console.error("Erreur lors du chargement de la hiérarchie:", error);
        }
      }
    };
    
    loadHierarchy();
  }, [forEntityId, forEntityType, services, directions]);
  
  // Retrouver la hiérarchie initiale lors du premier chargement du composant
  useEffect(() => {
    const initializeHierarchy = async () => {
      if (forEntityId && forEntityType && !selectedPoleId && !selectedDirectionId) {
        try {
          if (forEntityType === "service") {
            // Recherche du service et de sa hiérarchie
            const { data: service } = await supabase
              .from("services")
              .select("direction_id")
              .eq("id", forEntityId)
              .single();
            
            if (service) {
              setSelectedDirectionId(service.direction_id);
              
              // Trouver le pôle parent
              const { data: direction } = await supabase
                .from("directions")
                .select("pole_id")
                .eq("id", service.direction_id)
                .single();
                
              if (direction) {
                setSelectedPoleId(direction.pole_id);
              }
            }
          } else if (forEntityType === "direction") {
            // Recherche de la direction et de son pôle parent
            const { data: direction } = await supabase
              .from("directions")
              .select("pole_id")
              .eq("id", forEntityId)
              .single();
              
            if (direction) {
              setSelectedPoleId(direction.pole_id);
            }
          } else if (forEntityType === "pole") {
            setSelectedPoleId(forEntityId);
          }
        } catch (error) {
          console.error("Erreur lors de l'initialisation de la hiérarchie:", error);
        }
      }
    };
    
    initializeHierarchy();
  }, [forEntityId, forEntityType]);

  // Gérer le changement de type d'entité
  const handleEntityTypeChange = (value: string) => {
    setForEntityType(value === "null" ? null : value as ForEntityType);
    setForEntityId(undefined);
    setSelectedPoleId(undefined);
    setSelectedDirectionId(undefined);
  };
  
  // Gérer les sélections en fonction du type d'entité
  const renderEntitySelector = () => {
    if (!forEntityType) return null;
    
    const isLoading = isLoadingPoles || (forEntityType !== "pole" && isLoadingDirections) || (forEntityType === "service" && isLoadingServices);
    
    if (isLoading) {
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
            
            {selectedPoleId && (
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
            
            {selectedPoleId && (
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
            
            {selectedDirectionId && (
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
