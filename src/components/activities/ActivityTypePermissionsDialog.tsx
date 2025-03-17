
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActivityTypePermissions } from "@/hooks/useActivityTypePermissions";
import { HierarchyEntity, ActivityTypePermission } from "@/types/activity";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityTypePermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activityTypeCode: string;
  activityTypeLabel: string;
}

export function ActivityTypePermissionsDialog({
  isOpen,
  onClose,
  activityTypeCode,
  activityTypeLabel,
}: ActivityTypePermissionsDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("poles");
  const [search, setSearch] = useState<string>("");
  const [cascadeSelection, setCascadeSelection] = useState<boolean>(false);
  const [selectedEntities, setSelectedEntities] = useState<{
    poles: Record<string, boolean>;
    directions: Record<string, boolean>;
    services: Record<string, boolean>;
  }>({
    poles: {},
    directions: {},
    services: {},
  });
  
  const {
    permissions,
    isLoading,
    poles,
    directions,
    services,
    directionsByPole,
    servicesByDirection,
    updatePermissionsBatch,
    isUpdating,
    hasPermission,
  } = useActivityTypePermissions(activityTypeCode);

  // Initialiser les sélections en fonction des permissions existantes
  useEffect(() => {
    if (permissions) {
      const newSelectedEntities = {
        poles: {},
        directions: {},
        services: {},
      };

      permissions.forEach(permission => {
        if (permission.entity_type === 'pole') {
          newSelectedEntities.poles[permission.entity_id] = true;
        } else if (permission.entity_type === 'direction') {
          newSelectedEntities.directions[permission.entity_id] = true;
        } else if (permission.entity_type === 'service') {
          newSelectedEntities.services[permission.entity_id] = true;
        }
      });

      setSelectedEntities(newSelectedEntities);
    }
  }, [permissions]);

  // Filtrer les entités en fonction de la recherche
  const filterEntities = (entities: HierarchyEntity[] | undefined) => {
    if (!entities) return [];
    if (!search) return entities;

    return entities.filter(entity => 
      entity.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const toggleEntity = (type: 'poles' | 'directions' | 'services', id: string) => {
    setSelectedEntities(prev => {
      const newState = {
        ...prev,
        [type]: {
          ...prev[type],
          [id]: !prev[type][id],
        },
      };

      // Si la sélection en cascade est activée, sélectionner/désélectionner les entités enfants
      if (cascadeSelection) {
        if (type === 'poles') {
          const poleSelected = !prev.poles[id];
          
          // Sélectionner/désélectionner toutes les directions de ce pôle
          const directionsForPole = directionsByPole?.[id] || [];
          directionsForPole.forEach(direction => {
            newState.directions[direction.id] = poleSelected;
            
            // Sélectionner/désélectionner tous les services de cette direction
            const servicesForDirection = servicesByDirection?.[direction.id] || [];
            servicesForDirection.forEach(service => {
              newState.services[service.id] = poleSelected;
            });
          });
        } else if (type === 'directions') {
          const directionSelected = !prev.directions[id];
          
          // Sélectionner/désélectionner tous les services de cette direction
          const servicesForDirection = servicesByDirection?.[id] || [];
          servicesForDirection.forEach(service => {
            newState.services[service.id] = directionSelected;
          });
        }
      }

      return newState;
    });
  };

  const handleSave = () => {
    const currentPermissions = permissions || [];
    const entitiesToAdd: { entity_type: 'pole' | 'direction' | 'service'; entity_id: string }[] = [];
    const entitiesToRemove: string[] = [];

    // Déterminer les permissions à ajouter
    Object.entries(selectedEntities.poles).forEach(([id, selected]) => {
      if (selected && !hasPermission('pole', id)) {
        entitiesToAdd.push({ entity_type: 'pole', entity_id: id });
      }
    });

    Object.entries(selectedEntities.directions).forEach(([id, selected]) => {
      if (selected && !hasPermission('direction', id)) {
        entitiesToAdd.push({ entity_type: 'direction', entity_id: id });
      }
    });

    Object.entries(selectedEntities.services).forEach(([id, selected]) => {
      if (selected && !hasPermission('service', id)) {
        entitiesToAdd.push({ entity_type: 'service', entity_id: id });
      }
    });

    // Déterminer les permissions à supprimer
    currentPermissions.forEach(permission => {
      const { entity_type, entity_id, id } = permission;
      let shouldRemove = false;

      if (entity_type === 'pole' && !selectedEntities.poles[entity_id]) {
        shouldRemove = true;
      } else if (entity_type === 'direction' && !selectedEntities.directions[entity_id]) {
        shouldRemove = true;
      } else if (entity_type === 'service' && !selectedEntities.services[entity_id]) {
        shouldRemove = true;
      }

      if (shouldRemove) {
        entitiesToRemove.push(id);
      }
    });

    // Mettre à jour les permissions
    updatePermissionsBatch({
      activityTypeCode,
      entitiesToAdd,
      entitiesToRemove,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Permissions pour le type d'activité: {activityTypeLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Checkbox
                id="cascade-selection"
                checked={cascadeSelection}
                onCheckedChange={(checked) => setCascadeSelection(checked === true)}
              />
              <Label htmlFor="cascade-selection" className="text-sm cursor-pointer">
                Sélection en cascade
              </Label>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="poles">Pôles</TabsTrigger>
              <TabsTrigger value="directions">Directions</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden min-h-[300px]">
              <TabsContent value="poles" className="mt-0 h-full">
                {isLoading ? (
                  <div>Chargement des pôles...</div>
                ) : (
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-3">
                      {filterEntities(poles)?.map(pole => (
                        <div key={pole.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`pole-${pole.id}`}
                            checked={!!selectedEntities.poles[pole.id]}
                            onCheckedChange={() => toggleEntity('poles', pole.id)}
                          />
                          <Label htmlFor={`pole-${pole.id}`} className="cursor-pointer">
                            {pole.name}
                          </Label>
                        </div>
                      ))}
                      {filterEntities(poles)?.length === 0 && (
                        <div className="text-center text-muted-foreground">
                          Aucun pôle trouvé
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="directions" className="mt-0 h-full">
                {isLoading ? (
                  <div>Chargement des directions...</div>
                ) : (
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-3">
                      {filterEntities(directions)?.map(direction => (
                        <div key={direction.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`direction-${direction.id}`}
                            checked={!!selectedEntities.directions[direction.id]}
                            onCheckedChange={() => toggleEntity('directions', direction.id)}
                          />
                          <Label htmlFor={`direction-${direction.id}`} className="cursor-pointer">
                            {direction.name}
                          </Label>
                        </div>
                      ))}
                      {filterEntities(directions)?.length === 0 && (
                        <div className="text-center text-muted-foreground">
                          Aucune direction trouvée
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="services" className="mt-0 h-full">
                {isLoading ? (
                  <div>Chargement des services...</div>
                ) : (
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-3">
                      {filterEntities(services)?.map(service => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={!!selectedEntities.services[service.id]}
                            onCheckedChange={() => toggleEntity('services', service.id)}
                          />
                          <Label htmlFor={`service-${service.id}`} className="cursor-pointer">
                            {service.name}
                          </Label>
                        </div>
                      ))}
                      {filterEntities(services)?.length === 0 && (
                        <div className="text-center text-muted-foreground">
                          Aucun service trouvé
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
