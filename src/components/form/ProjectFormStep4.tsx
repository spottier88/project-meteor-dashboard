import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Building, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectFormStep4Props {
  forEntity: any;
  setForEntity: (value: any) => void;
  suiviDGS: boolean;
  setSuiviDGS: (value: boolean) => void;
  project?: any;
}

export const ProjectFormStep4: React.FC<ProjectFormStep4Props> = ({
  forEntity,
  setForEntity,
  suiviDGS,
  setSuiviDGS,
  project
}) => {
  const handleEntityTypeChange = (value: string) => {
    setForEntity({
      ...forEntity,
      type: value,
      id: "",
    });
  };

  const handleEntityIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForEntity({
      ...forEntity,
      id: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <CardTitle>Informations complémentaires</CardTitle>
          </div>
          <CardDescription>
            Informations additionnelles pour le suivi du projet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="entity-type">Pour le compte de</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Indiquez si ce projet est réalisé pour une entité spécifique</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={forEntity?.type || ""}
                onValueChange={handleEntityTypeChange}
              >
                <SelectTrigger id="entity-type">
                  <SelectValue placeholder="Sélectionnez un type d'entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune entité</SelectItem>
                  <SelectItem value="commune">Commune</SelectItem>
                  <SelectItem value="epci">EPCI</SelectItem>
                  <SelectItem value="departement">Département</SelectItem>
                  <SelectItem value="region">Région</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {forEntity?.type && (
              <div className="space-y-2">
                <Label htmlFor="entity-id">
                  {forEntity.type === "commune"
                    ? "Code INSEE"
                    : forEntity.type === "epci"
                    ? "Code SIREN"
                    : forEntity.type === "departement"
                    ? "Numéro de département"
                    : forEntity.type === "region"
                    ? "Code région"
                    : "Identifiant"}
                </Label>
                <Input
                  id="entity-id"
                  value={forEntity?.id || ""}
                  onChange={handleEntityIdChange}
                  placeholder={
                    forEntity.type === "commune"
                      ? "Ex: 75056"
                      : forEntity.type === "epci"
                      ? "Ex: 200054781"
                      : forEntity.type === "departement"
                      ? "Ex: 75"
                      : forEntity.type === "region"
                      ? "Ex: 11"
                      : "Identifiant de l'entité"
                  }
                />
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="suivi-dgs"
                checked={suiviDGS}
                onCheckedChange={setSuiviDGS}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="suivi-dgs">Suivi DGS</Label>
                <p className="text-sm text-muted-foreground">
                  Ce projet fait l'objet d'un suivi par la Direction Générale des Services
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
