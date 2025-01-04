import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PoleForm } from "@/components/organization/PoleForm";
import { DirectionForm } from "@/components/organization/DirectionForm";
import { ServiceForm } from "@/components/organization/ServiceForm";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const OrganizationManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États pour les formulaires
  const [isPoleFormOpen, setIsPoleFormOpen] = useState(false);
  const [isDirectionFormOpen, setIsDirectionFormOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [selectedPole, setSelectedPole] = useState<any>(null);
  const [selectedDirection, setSelectedDirection] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  
  // États pour les dialogues de confirmation de suppression
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'pole' | 'direction' | 'service';
    id: string;
    name: string;
  } | null>(null);

  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("poles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: directions } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("*, poles(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, directions(name)");
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from(itemToDelete.type + 's' as 'poles' | 'directions' | 'services')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${itemToDelete.name} a été supprimé`,
      });

      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ["poles"] });
      queryClient.invalidateQueries({ queryKey: ["directions"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const confirmDelete = (type: 'pole' | 'direction' | 'service', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["poles"] });
    queryClient.invalidateQueries({ queryKey: ["directions"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion de l'organisation
        </h1>
        <p className="text-muted-foreground">
          Gérez la hiérarchie des pôles, directions et services
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Pôles</h2>
            <Button onClick={() => setIsPoleFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau pôle
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poles?.map((pole) => (
                <TableRow key={pole.id}>
                  <TableCell>{pole.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedPole(pole);
                          setIsPoleFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => confirmDelete('pole', pole.id, pole.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Directions</h2>
            <Button onClick={() => setIsDirectionFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle direction
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Pôle</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directions?.map((direction) => (
                <TableRow key={direction.id}>
                  <TableCell>{direction.name}</TableCell>
                  <TableCell>{direction.poles?.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedDirection(direction);
                          setIsDirectionFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => confirmDelete('direction', direction.id, direction.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Services</h2>
            <Button onClick={() => setIsServiceFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau service
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.directions?.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedService(service);
                          setIsServiceFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => confirmDelete('service', service.id, service.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <PoleForm
        isOpen={isPoleFormOpen}
        onClose={() => {
          setIsPoleFormOpen(false);
          setSelectedPole(null);
        }}
        onSubmit={refreshData}
        pole={selectedPole}
      />

      <DirectionForm
        isOpen={isDirectionFormOpen}
        onClose={() => {
          setIsDirectionFormOpen(false);
          setSelectedDirection(null);
        }}
        onSubmit={refreshData}
        direction={selectedDirection}
      />

      <ServiceForm
        isOpen={isServiceFormOpen}
        onClose={() => {
          setIsServiceFormOpen(false);
          setSelectedService(null);
        }}
        onSubmit={refreshData}
        service={selectedService}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {itemToDelete?.name} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};