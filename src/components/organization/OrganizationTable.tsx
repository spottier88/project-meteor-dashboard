import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { PoleForm } from "./PoleForm";
import { DirectionForm } from "./DirectionForm";
import { ServiceForm } from "./ServiceForm";
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
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface OrganizationTableProps {
  data: Array<{
    id: string;
    name: string;
    directions: Array<{
      id: string;
      name: string;
      services: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }>;
}

export const OrganizationTable = ({ data }: OrganizationTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPole, setSelectedPole] = useState<any>(null);
  const [selectedDirection, setSelectedDirection] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "pole" | "direction" | "service";
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from(
          itemToDelete.type === "pole"
            ? "poles"
            : itemToDelete.type === "direction"
            ? "directions"
            : "services"
        )
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["poles"] });
      toast({
        title: "Succès",
        description: `${
          itemToDelete.type === "pole"
            ? "Le pôle"
            : itemToDelete.type === "direction"
            ? "La direction"
            : "Le service"
        } a été supprimé`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pôle</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Service</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((pole) => (
            <>
              {pole.directions.length === 0 ? (
                <TableRow key={pole.id}>
                  <TableCell>{pole.name}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPole(pole)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setItemToDelete({
                            type: "pole",
                            id: pole.id,
                            name: pole.name,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pole.directions.map((direction, dirIndex) => (
                  <>
                    {direction.services.length === 0 ? (
                      <TableRow key={`${pole.id}-${direction.id}`}>
                        <TableCell>
                          {dirIndex === 0 ? pole.name : ""}
                        </TableCell>
                        <TableCell>{direction.name}</TableCell>
                        <TableCell />
                        <TableCell>
                          <div className="flex gap-2">
                            {dirIndex === 0 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedPole(pole)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setItemToDelete({
                                      type: "pole",
                                      id: pole.id,
                                      name: pole.name,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedDirection(direction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setItemToDelete({
                                  type: "direction",
                                  id: direction.id,
                                  name: direction.name,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      direction.services.map((service, servIndex) => (
                        <TableRow
                          key={`${pole.id}-${direction.id}-${service.id}`}
                        >
                          <TableCell>
                            {dirIndex === 0 && servIndex === 0 ? pole.name : ""}
                          </TableCell>
                          <TableCell>
                            {servIndex === 0 ? direction.name : ""}
                          </TableCell>
                          <TableCell>{service.name}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {dirIndex === 0 && servIndex === 0 && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedPole(pole)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setItemToDelete({
                                        type: "pole",
                                        id: pole.id,
                                        name: pole.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {servIndex === 0 && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedDirection(direction)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setItemToDelete({
                                        type: "direction",
                                        id: direction.id,
                                        name: direction.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedService(service)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setItemToDelete({
                                    type: "service",
                                    id: service.id,
                                    name: service.name,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </>
                ))
              )}
            </>
          ))}
        </TableBody>
      </Table>

      <PoleForm
        isOpen={!!selectedPole}
        onClose={() => setSelectedPole(null)}
        pole={selectedPole}
      />
      <DirectionForm
        isOpen={!!selectedDirection}
        onClose={() => setSelectedDirection(null)}
        poles={data}
        direction={selectedDirection}
      />
      <ServiceForm
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        poles={data}
        service={selectedService}
      />

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera
              définitivement{" "}
              {itemToDelete?.type === "pole"
                ? "le pôle"
                : itemToDelete?.type === "direction"
                ? "la direction"
                : "le service"}{" "}
              {itemToDelete?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};