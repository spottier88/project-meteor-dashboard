
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PoleDirectionServiceFilterProps {
  selectedPoleId?: string;
  selectedDirectionId?: string;
  selectedServiceId?: string;
  onPoleChange: (poleId: string | undefined) => void;
  onDirectionChange: (directionId: string | undefined) => void;
  onServiceChange: (serviceId: string | undefined) => void;
}

export const PoleDirectionServiceFilter = ({
  selectedPoleId,
  selectedDirectionId,
  selectedServiceId,
  onPoleChange,
  onDirectionChange,
  onServiceChange
}: PoleDirectionServiceFilterProps) => {
  // Pour simplifier, nous utilisons des données statiques
  // Dans un vrai projet, ces données viendraient de la base de données
  const poles = [
    { id: "1", name: "Pôle Technique" },
    { id: "2", name: "Pôle Commercial" },
    { id: "3", name: "Pôle RH" }
  ];

  const directions = [
    { id: "1", name: "Direction IT", poleId: "1" },
    { id: "2", name: "Direction Ventes", poleId: "2" },
    { id: "3", name: "Direction Formation", poleId: "3" }
  ];

  const services = [
    { id: "1", name: "Service Développement", directionId: "1" },
    { id: "2", name: "Service Support", directionId: "1" },
    { id: "3", name: "Service Commercial", directionId: "2" }
  ];

  const filteredDirections = directions.filter(d => d.poleId === selectedPoleId);
  const filteredServices = services.filter(s => s.directionId === selectedDirectionId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="pole">Pôle</Label>
        <Select value={selectedPoleId || ""} onValueChange={(value) => onPoleChange(value || undefined)}>
          <SelectTrigger id="pole">
            <SelectValue placeholder="Tous les pôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les pôles</SelectItem>
            <SelectItem value="none">Sans pôle</SelectItem>
            {poles.map((pole) => (
              <SelectItem key={pole.id} value={pole.id}>
                {pole.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="direction">Direction</Label>
        <Select 
          value={selectedDirectionId || ""} 
          onValueChange={(value) => onDirectionChange(value || undefined)}
          disabled={!selectedPoleId}
        >
          <SelectTrigger id="direction">
            <SelectValue placeholder="Toutes les directions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les directions</SelectItem>
            <SelectItem value="none">Sans direction</SelectItem>
            {filteredDirections.map((direction) => (
              <SelectItem key={direction.id} value={direction.id}>
                {direction.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="service">Service</Label>
        <Select 
          value={selectedServiceId || ""} 
          onValueChange={(value) => onServiceChange(value || undefined)}
          disabled={!selectedDirectionId}
        >
          <SelectTrigger id="service">
            <SelectValue placeholder="Tous les services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les services</SelectItem>
            <SelectItem value="none">Sans service</SelectItem>
            {filteredServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
