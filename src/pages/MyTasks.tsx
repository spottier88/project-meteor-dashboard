/**
 * @file MyTasks.tsx
 * @description Page "Mes tâches" avec vues multiples (tableau, kanban, calendrier, gantt),
 * filtres, lien vers le projet et auto-refresh toutes les 30 secondes.
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { useMyTasks } from "@/hooks/useMyTasks";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { TaskCard } from "@/components/task/TaskCard";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskForm } from "@/components/task/TaskForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { MyTasksKanban } from "@/components/task/MyTasksKanban";
import { MyTasksCalendar } from "@/components/task/MyTasksCalendar";
import { TaskGantt } from "@/components/task/TaskGantt";
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

  // État des filtres
  const [showOverdueOnly, setShowOverdueOnly] = useState(
    new URLSearchParams(location.search).get("filter") === "overdue"
  );
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>("table");

  // États pour l'édition et la suppression
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  const { data: tasks, isLoading } = useMyTasks(showOverdueOnly);

  // Synchroniser le filtre overdue avec l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (showOverdueOnly) {
      params.set("filter", "overdue");
    } else {
      params.delete("filter");
    }
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [showOverdueOnly, location.pathname, navigate]);

  // Projets uniques pour le filtre
  const uniqueProjects = tasks
    ? [...new Set(tasks.map(t => t.project_id))].map(pid => {
        const task = tasks.find(t => t.project_id === pid);
        return { id: pid, title: task?.projects?.title || "Projet inconnu" };
      })
    : [];

  // Filtrage par projet et statut terminé
  const filteredTasks = tasks
    ? tasks
        .filter(t => selectedProject === "all" || t.project_id === selectedProject)
        .filter(t => showCompletedTasks || t.status !== "done")
    : [];

  // Handlers
  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskToDelete.id);
      if (error) throw error;
      toast({ title: "Succès", description: "La tâche a été supprimée" });
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue lors de la suppression", variant: "destructive" });
    } finally {
      setTaskToDelete(null);
    }
  };

  // Préparer les tâches pour la vue Gantt (regroupées par projet)
  const ganttTasks = filteredTasks.map(t => ({
    ...t,
    project_id: t.project_id,
  }));

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Bouton retour */}
      <Button variant="ghost" className="mb-6" onClick={() => void navigate("/")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au tableau de bord
      </Button>

      {/* En-tête avec titre et compteur */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Mes tâches</h1>
          <p className="text-muted-foreground">
            {filteredTasks.length} tâche(s)
            {showOverdueOnly ? " en retard" : ""}
            {!showCompletedTasks ? " (tâches terminées masquées)" : ""}
          </p>
        </div>

        {/* Toggle de vue */}
        <ViewToggle
          currentView={currentView}
          onViewChange={setCurrentView}
          availableViews={["table", "grid", "calendar", "gantt"]}
        />

        {/* Barre de filtres */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Toggle tâches terminées */}
          <div className="flex items-center space-x-2">
            <Switch
              id="completed-tasks-toggle"
              checked={showCompletedTasks}
              onCheckedChange={setShowCompletedTasks}
            />
            <Label htmlFor="completed-tasks-toggle" className="flex items-center gap-1 text-sm">
              {showCompletedTasks ? (
                <><Eye className="h-4 w-4" /><span>Masquer terminées</span></>
              ) : (
                <><EyeOff className="h-4 w-4" /><span>Afficher terminées</span></>
              )}
            </Label>
          </div>

          {/* Filtre statut */}
          <Select
            value={showOverdueOnly ? "overdue" : "all"}
            onValueChange={(v) => setShowOverdueOnly(v === "overdue")}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes mes tâches</SelectItem>
              <SelectItem value="overdue">Tâches en retard</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre projet */}
          {uniqueProjects.length > 1 && (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {uniqueProjects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Contenu principal selon la vue */}
      {isLoading ? (
        <div className="text-center py-8">Chargement de vos tâches...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {showOverdueOnly
            ? "Aucune tâche en retard. Bravo !"
            : "Aucune tâche ne vous est assignée actuellement."}
        </div>
      ) : (
        <>
          {/* Vue Tableau */}
          {currentView === "table" && (
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
                    onEdit={handleEditTask}
                    onDelete={() => setTaskToDelete(task)}
                  />
                ))}
              </TableBody>
            </Table>
          )}

          {/* Vue Kanban */}
          {currentView === "grid" && (
            <MyTasksKanban tasks={filteredTasks} onEdit={handleEditTask} />
          )}

          {/* Vue Calendrier */}
          {currentView === "calendar" && (
            <MyTasksCalendar tasks={filteredTasks} onEdit={handleEditTask} />
          )}

          {/* Vue Gantt/Timeline */}
          {currentView === "gantt" && (
            <TaskGantt
              tasks={ganttTasks}
              projectId={selectedProject !== "all" ? selectedProject : (uniqueProjects[0]?.id || "")}
              onEdit={handleEditTask}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ["myTasks"] })}
              isProjectClosed={false}
              projectTitle="Mes tâches"
              exportContext="project"
            />
          )}
        </>
      )}

      {/* Formulaire d'édition de tâche */}
      {selectedTask && (
        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={() => { setIsTaskFormOpen(false); setSelectedTask(null); }}
          onSubmit={() => queryClient.invalidateQueries({ queryKey: ["myTasks"] })}
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
            <AlertDialogAction onClick={handleDeleteTask}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
