import React from 'react';
import Timeline from 'react-gantt-timeline';
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from '@/types/project';

interface GanttTask {
  id: string;
  start: Date;
  end: Date;
  name: string;
  color: string;
  type: 'project' | 'task';
  project_id?: string;
  status?: ProjectStatus;
  progress?: ProgressStatus;
  lifecycle_status?: ProjectLifecycleStatus;
}

interface ProjectGanttViewProps {
  projects: Array<{
    id: string;
    title: string;
    start_date?: string;
    end_date?: string;
    status?: ProjectStatus;
    progress?: ProgressStatus;
    lifecycle_status: ProjectLifecycleStatus;
    tasks?: Array<{
      id: string;
      title: string;
      start_date?: string;
      due_date?: string;
      status: "todo" | "in_progress" | "done";
    }>;
  }>;
}

export const ProjectGanttView = ({ projects }: ProjectGanttViewProps) => {
  const getColorForStatus = (status: ProjectLifecycleStatus | string) => {
    switch (status) {
      case 'in_progress':
        return '#93c5fd'; // blue-300
      case 'completed':
        return '#86efac'; // green-300
      case 'suspended':
        return '#fde047'; // yellow-300
      case 'abandoned':
        return '#fca5a5'; // red-300
      default:
        return '#e5e7eb'; // gray-200
    }
  };

  const tasks: GanttTask[] = projects.flatMap((project) => {
    const projectTask: GanttTask = {
      id: project.id,
      start: project.start_date ? new Date(project.start_date) : new Date(),
      end: project.end_date ? new Date(project.end_date) : new Date(),
      name: project.title,
      color: getColorForStatus(project.lifecycle_status),
      type: 'project'
    };

    const subTasks: GanttTask[] = (project.tasks || []).map((task) => ({
      id: `${project.id}-${task.id}`,
      start: task.start_date ? new Date(task.start_date) : new Date(),
      end: task.due_date ? new Date(task.due_date) : new Date(),
      name: task.title,
      color: getColorForStatus(task.status),
      type: 'task',
      project_id: project.id
    }));

    return [projectTask, ...subTasks];
  });

  return (
    <div className="h-[600px] w-full">
      <Timeline 
        data={tasks}
        links={[]}
        mode="month"
        onSelectItem={(item) => console.log("Item clicked:", item)}
        itemHeight={40}
        nonWorkingDays={[6, 0]} // Weekends
        dayWidth={30}
      />
    </div>
  );
};