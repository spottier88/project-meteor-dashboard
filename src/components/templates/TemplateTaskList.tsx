
import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TemplateTask {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  duration_days?: number;
  order_index: number;
  parent_task_id?: string;
  created_at: string;
  updated_at: string;
}

interface TemplateTaskListProps {
  tasks: TemplateTask[];
  isLoading: boolean;
  onEdit: (task: TemplateTask) => void;
  onDelete: (id: string) => void;
  onOpenDialog: () => void;
}

export const TemplateTaskList = ({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onOpenDialog
}: TemplateTaskListProps) => {

  // Organiser les tâches par parents et enfants
  const parentTasks = tasks.filter(task => !task.parent_task_id);
  const childTasks = tasks.filter(task => task.parent_task_id);

  const getChildTasks = (parentId: string) => {
    return childTasks.filter(task => task.parent_task_id === parentId);
  };

  const renderTaskDuration = (days?: number) => {
    if (!days) return "-";
    return days === 1 ? "1 jour" : `${days} jours`;
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'todo':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">À faire</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">En cours</span>;
      case 'done':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Terminée</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-lg text-muted-foreground mb-2">Aucune tâche définie</p>
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez des tâches à ce modèle pour définir la structure de vos futurs projets.
          </p>
          <Button onClick={onOpenDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une tâche
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Titre</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parentTasks.map(task => (
            <React.Fragment key={task.id}>
              <TableRow>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell className="max-w-xs truncate">{task.description || "-"}</TableCell>
                <TableCell>{renderStatusBadge(task.status)}</TableCell>
                <TableCell>{renderTaskDuration(task.duration_days)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Modifier</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. La tâche "{task.title}" et ses éventuelles sous-tâches seront définitivement supprimées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(task.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
              
              {getChildTasks(task.id).map(childTask => (
                <TableRow key={childTask.id} className="bg-muted/30">
                  <TableCell className="pl-8">↳ {childTask.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{childTask.description || "-"}</TableCell>
                  <TableCell>{renderStatusBadge(childTask.status)}</TableCell>
                  <TableCell>{renderTaskDuration(childTask.duration_days)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(childTask)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette sous-tâche ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. La sous-tâche "{childTask.title}" sera définitivement supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(childTask.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
