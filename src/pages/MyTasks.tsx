
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMyTasks } from "@/hooks/use-my-tasks";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { TaskCard } from "@/components/task/TaskCard";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const MyTasks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOverdueOnly, setShowOverdueOnly] = useState(
    new URLSearchParams(location.search).get("filter") === "overdue"
  );
  const [selectedProject, setSelectedProject] = useState<string>("all");
  
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

  // Filtrer les tâches par projet si un projet est sélectionné
  const filteredTasks = tasks ? 
    selectedProject === "all" 
      ? tasks 
      : tasks.filter(task => task.project_id === selectedProject)
    : [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    refetch();
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
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
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
                onEdit={() => navigate(`/tasks/${task.project_id}`)}
                onDelete={() => refetch()}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
