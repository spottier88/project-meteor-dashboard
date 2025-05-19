
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectTemplateTask, useProjectTemplates } from "@/hooks/useProjectTemplates";
import { PlusCircle, Pencil, Trash2, ChevronDown, ChevronRight, MoveVertical } from "lucide-react";
import { TemplateTaskForm } from "./TemplateTaskForm";
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

interface TemplateTaskListProps {
  templateId: string;
  tasks: ProjectTemplateTask[];
  onTasksChanged: () => void;
}

export const TemplateTaskList = ({ 
  templateId, 
  tasks, 
  onTasksChanged 
}: TemplateTaskListProps) => {
  const { createTemplateTask, updateTemplateTask, deleteTemplateTask } = useProjectTemplates();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<ProjectTemplateTask | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string, title: string } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Organiser les tâches par hiérarchie
  const mainTasks = tasks.filter(task => task.parent_task_id === null);
  const subTasksMap: Record<string, ProjectTemplateTask[]> = {};
  
  tasks
    .filter(task => task.parent_task_id !== null)
    .forEach(task => {
      const parentId = task.parent_task_id as string;
      if (!subTasksMap[parentId]) {
        subTasksMap[parentId] = [];
      }
      subTasksMap[parentId].push(task);
    });

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleAddTask = () => {
    setCurrentTask(undefined);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: ProjectTemplateTask) => {
    setCurrentTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (task: ProjectTemplateTask) => {
    setTaskToDelete({ id: task.id, title: task.title });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    await deleteTemplateTask.mutateAsync({ 
      id: taskToDelete.id,
      template_id: templateId
    });
    
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
    onTasksChanged();
  };

  const handleTaskSubmit = async (taskData: Partial<ProjectTemplateTask>) => {
    if (currentTask) {
      await updateTemplateTask.mutateAsync({ id: currentTask.id, ...taskData });
    } else {
      await createTemplateTask.mutateAsync(taskData as any);
    }
    
    setIsFormOpen(false);
    onTasksChanged();
  };

  // Fonction récursive pour rendre les tâches et leurs sous-tâches
  const renderTasks = (tasksList: ProjectTemplateTask[], level = 0) => {
    return tasksList.map(task => (
      <div key={task.id} style={{ paddingLeft: `${level * 1}rem` }}>
        <div className="flex items-center justify-between p-2 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-center flex-1">
            {subTasksMap[task.id] && subTasksMap[task.id].length > 0 ? (
              <button 
                onClick={() => toggleTaskExpansion(task.id)} 
                className="mr-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {expandedTasks[task.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6"></div>
            )}
            
            <div className="flex-1">
              <div className="font-medium">{task.title}</div>
              {task.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {task.description}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
              {task.duration_days ? `${task.duration_days} j` : "Durée N/A"}
            </span>
            
            <span className={`text-xs px-2 py-1 rounded-full ${
              task.status === "todo" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : 
              task.status === "in_progress" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : 
              "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            }`}>
              {task.status === "todo" ? "À faire" : 
               task.status === "in_progress" ? "En cours" : "Terminé"}
            </span>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleEditTask(task)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDeleteTask(task)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {expandedTasks[task.id] && subTasksMap[task.id] && (
          <div className="ml-4">
            {renderTasks(subTasksMap[task.id], level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tâches du modèle</h3>
        <Button onClick={handleAddTask} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter une tâche
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Aucune tâche définie pour ce modèle. Utilisez le bouton "Ajouter une tâche" pour commencer.
          </div>
        ) : (
          <div>
            <div className="py-2 px-4 bg-gray-50 dark:bg-gray-800 border-b flex justify-between">
              <div className="font-medium">Tâche</div>
              <div className="font-medium">Actions</div>
            </div>
            {renderTasks(mainTasks)}
          </div>
        )}
      </div>
      
      <TemplateTaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleTaskSubmit}
        task={currentTask}
        templateId={templateId}
        // Filtrer pour n'inclure que les tâches principales comme parents potentiels
        // afin de respecter la limitation à un niveau de hiérarchie
        parentTasks={tasks.filter(t => t.parent_task_id === null)}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la tâche</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la tâche "{taskToDelete?.title}" ?
              {subTasksMap[taskToDelete?.id || ""] && subTasksMap[taskToDelete?.id || ""].length > 0 && (
                <span className="block mt-2 font-bold text-red-500">
                  Attention : Cette tâche a des sous-tâches qui seront également supprimées.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
