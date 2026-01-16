/**
 * @file ProjectGanttView.tsx
 * @description Vue Gantt pour afficher plusieurs projets et leurs tâches.
 * Utilise gantt-task-react (bibliothèque maintenue) pour le rendu du diagramme.
 * Permet de visualiser le planning multi-projets avec différents modes de vue.
 */

import React, { useState, useRef } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import "@/styles/gantt.css";
import { Button } from "@/components/ui/button";
import { CalendarDays, CalendarRange, Calendar, List } from "lucide-react";
import { GanttExportButtons } from './GanttExportButtons';
import { GanttLegend } from './GanttLegend';
import { ProjectGanttViewProps } from './types';

/**
 * Obtient la couleur en fonction du statut de la tâche
 * @param status - Statut de la tâche (todo, in_progress, done)
 * @param isProject - Indique si c'est un projet
 * @returns Couleur hexadécimale correspondante
 */
const getColorForStatus = (status: string, isProject?: boolean): string => {
  if (isProject) return '#9b87f5'; // Violet pour les projets
  
  switch (status) {
    case 'todo':
      return '#e2e8f0'; // Gris clair
    case 'in_progress':
      return '#3b82f6'; // Bleu
    case 'done':
      return '#22c55e'; // Vert
    default:
      return '#94a3b8'; // Gris par défaut
  }
};

/**
 * Transforme les projets et leurs tâches au format attendu par gantt-task-react
 * @param projects - Liste des projets avec leurs tâches
 * @param showTasks - Afficher ou non les tâches
 * @param collapsedProjects - Set des IDs des projets repliés
 * @returns Tableau de tâches formatées pour le Gantt
 */
const mapProjectsToGanttFormat = (
  projects: ProjectGanttViewProps['projects'],
  showTasks: boolean,
  collapsedProjects: Set<string>
): Task[] => {
  const allTasks: Task[] = [];
  
  // Tri des projets par date de début
  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
    return dateA - dateB;
  });
  
  sortedProjects.forEach(project => {
    // Dates du projet
    const projectStart = project.start_date ? new Date(project.start_date) : new Date();
    let projectEnd = project.end_date ? new Date(project.end_date) : new Date();
    
    // S'assurer que la date de fin est après la date de début
    if (projectEnd <= projectStart) {
      projectEnd = new Date(projectStart);
      projectEnd.setDate(projectEnd.getDate() + 30); // Par défaut 30 jours
    }
    
    // Ajouter le projet comme élément de type 'project'
    allTasks.push({
      id: project.id,
      name: project.title,
      start: projectStart,
      end: projectEnd,
      progress: project.completion || 0,
      type: 'project',
      hideChildren: collapsedProjects.has(project.id),
      styles: { 
        backgroundColor: '#9b87f5', 
        progressColor: '#7c3aed',
        progressSelectedColor: '#6d28d9',
      }
    });
    
    // Ajouter les tâches du projet si showTasks est activé et le projet n'est pas replié
    if (showTasks && project.tasks && !collapsedProjects.has(project.id)) {
      // Trier les tâches par date de début
      const sortedTasks = [...project.tasks].sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
      
      sortedTasks.forEach(task => {
        // Dates de la tâche
        let taskStart = task.start_date ? new Date(task.start_date) : new Date(projectStart);
        let taskEnd = task.due_date ? new Date(task.due_date) : new Date(taskStart);
        
        // S'assurer que la date de fin est après la date de début
        if (taskEnd <= taskStart) {
          taskEnd = new Date(taskStart);
          taskEnd.setDate(taskEnd.getDate() + 1);
        }
        
        // Calculer la progression en fonction du statut
        let progress = 0;
        if (task.status === 'in_progress') progress = 50;
        if (task.status === 'done') progress = 100;
        
        // Déterminer si c'est une sous-tâche
        const isSubtask = !!task.parent_task_id;
        
        allTasks.push({
          id: `${project.id}-${task.id}`,
          name: isSubtask ? `  └ ${task.title}` : task.title,
          start: taskStart,
          end: taskEnd,
          progress,
          type: 'task',
          project: project.id,
          styles: { 
            backgroundColor: getColorForStatus(task.status),
            progressColor: '#4d7c0f',
            progressSelectedColor: '#84cc16',
          }
        });
      });
    }
  });
  
  return allTasks;
};

/**
 * Composant principal de la vue Gantt multi-projets
 * Affiche les projets et leurs tâches dans un diagramme de Gantt interactif
 */
export const ProjectGanttView = ({ projects }: ProjectGanttViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [showTasks, setShowTasks] = useState<boolean>(false);
  const [showTaskList, setShowTaskList] = useState<boolean>(true);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const ganttRef = useRef<HTMLDivElement>(null);
  
  // Transformer les projets au format Gantt
  const ganttTasks = mapProjectsToGanttFormat(projects, showTasks, collapsedProjects);
  
  // Calcul de la largeur des colonnes selon le mode de vue
  let columnWidth = 65;
  if (viewMode === ViewMode.Year) {
    columnWidth = 250;
  } else if (viewMode === ViewMode.Month) {
    columnWidth = 200;
  } else if (viewMode === ViewMode.Week) {
    columnWidth = 100;
  }
  
  /**
   * Gère le clic sur l'expandeur pour replier/déplier un projet
   */
  const handleExpanderClick = (task: Task) => {
    if (task.type === 'project') {
      setCollapsedProjects(prev => {
        const newSet = new Set(prev);
        if (newSet.has(task.id)) {
          newSet.delete(task.id);
        } else {
          newSet.add(task.id);
        }
        return newSet;
      });
    }
  };

  // Si aucun projet n'a de dates, afficher un message
  if (ganttTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Aucun projet avec des dates à afficher
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils avec boutons de vue et export */}
      <div className="flex flex-wrap justify-between items-center gap-2 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-wrap gap-2">
          {/* Boutons de changement de mode de vue */}
          <Button
            size="sm"
            variant={viewMode === ViewMode.Day ? "default" : "outline"}
            onClick={() => setViewMode(ViewMode.Day)}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Jour
          </Button>
          <Button
            size="sm"
            variant={viewMode === ViewMode.Week ? "default" : "outline"}
            onClick={() => setViewMode(ViewMode.Week)}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Semaine
          </Button>
          <Button
            size="sm"
            variant={viewMode === ViewMode.Month ? "default" : "outline"}
            onClick={() => setViewMode(ViewMode.Month)}
          >
            <CalendarRange className="h-4 w-4 mr-2" />
            Mois
          </Button>
          <Button
            size="sm"
            variant={viewMode === ViewMode.Year ? "default" : "outline"}
            onClick={() => setViewMode(ViewMode.Year)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Année
          </Button>
          
          {/* Séparateur visuel */}
          <div className="w-px h-8 bg-border mx-2" />
          
          {/* Toggle affichage des tâches */}
          <Button
            size="sm"
            variant={showTasks ? "default" : "outline"}
            onClick={() => setShowTasks(!showTasks)}
          >
            <List className="h-4 w-4 mr-2" />
            {showTasks ? "Masquer tâches" : "Afficher tâches"}
          </Button>
          
          {/* Toggle liste latérale */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTaskList(!showTaskList)}
          >
            {showTaskList ? "Masquer liste" : "Afficher liste"}
          </Button>
        </div>
        
        {/* Boutons d'export */}
        <GanttExportButtons 
          tasks={ganttTasks} 
          ganttRef={ganttRef} 
        />
      </div>
      
      {/* Légende des couleurs */}
      <GanttLegend showTasks={showTasks} />
      
      {/* Diagramme de Gantt */}
      <div ref={ganttRef} className="border rounded-lg overflow-hidden">
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          onDateChange={() => {}} // Vue en lecture seule pour les projets
          onDoubleClick={() => {}} // Pas d'édition depuis cette vue
          onExpanderClick={handleExpanderClick}
          listCellWidth={showTaskList ? "200px" : ""}
          columnWidth={columnWidth}
          locale="fr"
          ganttHeight={400}
          TooltipContent={({ task }) => (
            <div className="p-2 bg-popover text-popover-foreground rounded shadow-lg border text-sm">
              <p className="font-semibold">{task.name}</p>
              <p className="text-muted-foreground">
                {task.start.toLocaleDateString('fr-FR')} - {task.end.toLocaleDateString('fr-FR')}
              </p>
              <p>Progression: {Math.round(task.progress)}%</p>
            </div>
          )}
        />
      </div>
    </div>
  );
};
