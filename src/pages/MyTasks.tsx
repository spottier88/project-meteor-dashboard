
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMyTasks } from "@/hooks/use-my-tasks";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, RotateCcw, Eye, EyeOff } from "lucide-react";
import { TaskCard } from "@/components/task/TaskCard";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskForm } from "@/components/task/TaskForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

export const MyTasks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showOverdueOnly, setShowOverdueOnly] = useState(
    new URLSearchParams(location.search).get("filter") === "overdue"
  );
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  
  // États pour gérer le formulaire d'édition et la suppression
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  
  const { data: tasks, isLoading, refetch } = useMyTasks(showOverdueOnly);
  
  // Mettre à jour l'URL lorsque le filtre change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (showOverdueOnly) {
      params.set("filter", "overdue");
    } else {
      params.delete("filter");
    }
    navigate({
      pathname: location.pathname,
      search: params.toString()
    }, { replace: true });
  }, [showOverdueOnly, location.pathname, navigate]);

  // Extraire tous les projets uniques des tâches pour le filtre
  const uniqueProjects = tasks ? [...new Set(tasks.map(task => task.project_id))]
    .map(projectId => {
      const task = tasks.find(t => t.project_id === projectId);
      return {
        id: projectId,
        title: task?.projects?.title || "Projet inconnu"
      };
    }) : [];

  // Filtrer les tâches par projet et par statut (terminé ou non)
  const filteredTasks = tasks ? 
    tasks
      .filter(task => selectedProject === "all" || task.project_id === selectedProject)
      .filter(task => showCompletedTasks || task.status !== "done")
    : [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    refetch();
  };

  // Fonction pour supprimer une tâche
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La tâche a été supprimée",
      });

      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      refetch();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setTaskToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au tableau de bord
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Mes tâches</h1>
          <p className="text-muted-foreground mb-4">
            {filteredTasks.length} tâche(s) 
            {showOverdueOnly ? " en retard" : ""}
            {!showCompletedTasks ? " (tâches terminées masquées)" : ""}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Switch 
              id="completed-tasks-toggle"
              checked={showCompletedTasks}
              onCheckedChange={setShowCompletedTasks}
            />
            <Label htmlFor="completed-tasks-toggle" className="flex items-center gap-2">
              {showCompletedTasks ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Masquer les tâches terminées</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Afficher les tâches terminées</span>
                </>
              )}
            </Label>
          </div>
          
          <Select
            value={showOverdueOnly ? "overdue" : "all"}
            onValueChange={(value) => setShowOverdueOnly(value === "overdue")}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes mes tâches</SelectItem>
              <SelectItem value="overdue">Tâches en retard</SelectItem>
            </SelectContent>
          </Select>
          
          {uniqueProjects.length > 1 && (
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {uniqueProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button 
            variant="outline"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Chargement de vos tâches...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {showOverdueOnly 
            ? "Aucune tâche en retard. Bravo !" 
            : "Aucune tâche ne vous est assignée actuellement."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projet</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date limite</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => {
                  setSelectedTask(task);
                  setIsTaskFormOpen(true);
                }}
                onDelete={() => setTaskToDelete(task)}
              />
            ))}
          </TableBody>
        </Table>
      )}

      {/* Formulaire d'édition de tâche */}
      {selectedTask && (
        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={() => {
            setIsTaskFormOpen(false);
            setSelectedTask(null);
          }}
          onSubmit={() => {
            queryClient.invalidateQueries({ queryKey: ["myTasks"] });
            refetch();
          }}
          projectId={selectedTask.project_id}
          task={selectedTask}
        />
      )}

      {/* Dialog de confirmation pour la suppression */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La tâche sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
