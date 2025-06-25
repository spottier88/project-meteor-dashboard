
/**
 * @component MonitoringLevelFilter
 * @description Composant de filtre avancé pour le niveau de suivi des projets.
 * Permet de filtrer par niveau (Aucun, DGS, Pôle, Direction) et de sélectionner
 * l'entité spécifique quand le niveau est "Pôle" ou "Direction".
 */

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonitoringLevel } from "@/types/monitoring";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonitoringLevelFilterProps {
  selectedLevel: MonitoringLevel | 'all';
  selectedEntityId?: string;
  onLevelChange: (level: MonitoringLevel | 'all') => void;
  onEntityChange: (entityId: string) => void;
}

export const MonitoringLevelFilter = ({ 
  selectedLevel, 
  selectedEntityId,
  onLevelChange, 
  onEntityChange 
}: MonitoringLevelFilterProps) => {
  // Récupérer les pôles pour le filtre
  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: selectedLevel === 'pole'
  });

  // Récupérer les directions pour le filtre
  const { data: directions } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: selectedLevel === 'direction'
  });

  // Réinitialiser l'entité sélectionnée quand le niveau change
  useEffect(() => {
    if (selectedLevel !== 'pole' && selectedLevel !== 'direction') {
      onEntityChange('all');
    }
  }, [selectedLevel, onEntityChange]);

  const handleLevelChange = (value: string) => {
    onLevelChange(value as MonitoringLevel | 'all');
  };

  const handleEntityChange = (value: string) => {
    onEntityChange(value);
  };

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor="monitoring-level">Niveau de suivi</Label>
        <Select value={selectedLevel} onValueChange={handleLevelChange}>
          <SelectTrigger id="monitoring-level">
            <SelectValue placeholder="Tous les niveaux" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            <SelectItem value="none">Aucun suivi</SelectItem>
            <SelectItem value="dgs">Suivi DGS</SelectItem>
            <SelectItem value="pole">Suivi Pôle</SelectItem>
            <SelectItem value="direction">Suivi Direction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sélecteur de pôle quand le niveau est "pole" */}
      {selectedLevel === 'pole' && (
        <div>
          <Label htmlFor="monitoring-pole">Pôle</Label>
          <Select value={selectedEntityId || 'all'} onValueChange={handleEntityChange}>
            <SelectTrigger id="monitoring-pole">
              <SelectValue placeholder="Sélectionner un pôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les pôles</SelectItem>
              {poles?.map((pole) => (
                <SelectItem key={pole.id} value={pole.id}>
                  {pole.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sélecteur de direction quand le niveau est "direction" */}
      {selectedLevel === 'direction' && (
        <div>
          <Label htmlFor="monitoring-direction">Direction</Label>
          <Select value={selectedEntityId || 'all'} onValueChange={handleEntityChange}>
            <SelectTrigger id="monitoring-direction">
              <SelectValue placeholder="Sélectionner une direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les directions</SelectItem>
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
};
