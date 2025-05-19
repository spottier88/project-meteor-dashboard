
import React from 'react';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TemplateTaskListProps {
  tasks: {
    id: string;
    title: string;
    description?: string;
    status: string;
    parent_task_id?: string;
    duration_days?: number;
    order_index?: number;
  }[];
  isLoading: boolean;
  onEdit: (task: any) => void;
  onDelete: (id: string) => void;
  onOpenDialog: () => void;
}

export const TemplateTaskList = ({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onOpenDialog,
}: TemplateTaskListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  // Séparer les tâches principales et les sous-tâches
  const parentTasks = tasks.filter(task => !task.parent_task_id);
  const childTasks = tasks.filter(task => task.parent_task_id);

  const getChildTasks = (parentId: string) => {
    return childTasks.filter(task => task.parent_task_id === parentId);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'todo':
        return <Badge variant="outline">À faire</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">En cours</Badge>;
      case 'done':
        return <Badge variant="default">Terminé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (tasks.length === 0) {
    return (
      <Card className="bg-muted/50">
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-lg text-muted-foreground mb-2">Aucune tâche dans ce modèle</p>
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez des tâches pour définir la structure de travail de ce type de projet.
          </p>
          <Button onClick={onOpenDialog} variant="outline">
            Ajouter une première tâche
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Titre</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Durée (jours)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parentTasks.map((task) => (
            <React.Fragment key={task.id}>
              <TableRow>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>{task.duration_days || '-'}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. La tâche "{task.title}" sera définitivement supprimée.
                          {getChildTasks(task.id).length > 0 && (
                            <strong className="block mt-2 text-destructive">
                              Attention : Cette tâche contient {getChildTasks(task.id).length} sous-tâche(s) qui seront également supprimées.
                            </strong>
                          )}
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

              {/* Afficher les sous-tâches avec un style en retrait */}
              {getChildTasks(task.id).map((childTask) => (
                <TableRow key={childTask.id} className="bg-muted/30">
                  <TableCell className="font-medium pl-8">↳ {childTask.title}</TableCell>
                  <TableCell>{getStatusBadge(childTask.status)}</TableCell>
                  <TableCell>{childTask.duration_days || '-'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(childTask)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
