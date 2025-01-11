import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const ManagerAssignments = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPoleId, setSelectedPoleId] = useState<string>("");
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["manager_assignments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_assignments")
        .select(`
          id,
          pole_id,
          direction_id,
          service_id,
          poles (id, name),
          directions (id, name),
          services (id, name)
        `)
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
  });

  // Fetch poles
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

  // Fetch directions when pole is selected
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
    enabled: !!selectedPoleId,
  });

  // Fetch services when direction is selected
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
    enabled: !!selectedDirectionId,
  });

  // Add assignment mutation
  const addAssignment = useMutation({
    mutationFn: async (assignment: any) => {
      const { error } = await supabase
        .from("manager_assignments")
        .insert([{ ...assignment, user_id: userId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager_assignments"] });
      toast({
        title: "Succès",
        description: "L'affectation a été ajoutée",
      });
      resetSelections();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'affectation",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("manager_assignments")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager_assignments"] });
      toast({
        title: "Succès",
        description: "L'affectation a été supprimée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'affectation",
        variant: "destructive",
      });
    },
  });

  const handleAddAssignment = () => {
    const assignment: any = {};
    if (selectedPoleId) assignment.pole_id = selectedPoleId;
    if (selectedDirectionId) assignment.direction_id = selectedDirectionId;
    if (selectedServiceId) assignment.service_id = selectedServiceId;
    
    addAssignment.mutate(assignment);
  };

  const resetSelections = () => {
    setSelectedPoleId("");
    setSelectedDirectionId("");
    setSelectedServiceId("");
  };

  if (isLoadingProfile || isLoadingAssignments || isLoadingPoles) {
    return <div className="container mx-auto py-8 px-4">Chargement des données...</div>;
  }

  if (!profile) {
    return <div className="container mx-auto py-8 px-4">Utilisateur non trouvé</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin/users")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à la gestion des utilisateurs
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des affectations
          </h1>
          <p className="text-muted-foreground">
            {profile.first_name} {profile.last_name}
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle affectation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Pôle</Label>
                <Select value={selectedPoleId} onValueChange={setSelectedPoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un pôle" />
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

              <div className="grid gap-2">
                <Label>Direction</Label>
                <Select 
                  value={selectedDirectionId} 
                  onValueChange={setSelectedDirectionId}
                  disabled={!selectedPoleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une direction" />
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

              <div className="grid gap-2">
                <Label>Service</Label>
                <Select 
                  value={selectedServiceId} 
                  onValueChange={setSelectedServiceId}
                  disabled={!selectedDirectionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
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

              <Button 
                onClick={handleAddAssignment}
                disabled={!selectedPoleId && !selectedDirectionId && !selectedServiceId}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter l'affectation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affectations existantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {assignments?.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex gap-2">
                    {assignment.poles && (
                      <Badge variant="secondary">
                        Pôle: {assignment.poles.name}
                      </Badge>
                    )}
                    {assignment.directions && (
                      <Badge variant="secondary">
                        Direction: {assignment.directions.name}
                      </Badge>
                    )}
                    {assignment.services && (
                      <Badge variant="secondary">
                        Service: {assignment.services.name}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAssignment.mutate(assignment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!assignments || assignments.length === 0) && (
                <p className="text-muted-foreground text-center py-4">
                  Aucune affectation
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};