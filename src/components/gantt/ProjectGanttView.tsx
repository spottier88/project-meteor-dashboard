import { Gantt, Task, ViewMode } from "@dhtmlx/trial-react-gantt";
import "@dhtmlx/trial-react-gantt/codebase/dhtmlxgantt.css";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";

interface GanttTask extends Task {
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
  const tasks: GanttTask[] = projects.flatMap((project) => {
    const projectTask: GanttTask = {
      id: project.id,
      text: project.title,
      start_date: project.start_date ? new Date(project.start_date) : new Date(),
      end_date: project.end_date ? new Date(project.end_date) : new Date(),
      type: "project",
      status: project.status,
      lifecycle_status: project.lifecycle_status,
      progress: project.progress || "stable"
    };

    const subTasks: GanttTask[] = (project.tasks || []).map((task) => ({
      id: `${project.id}-${task.id}`,
      text: task.title,
      start_date: task.start_date ? new Date(task.start_date) : new Date(),
      end_date: task.due_date ? new Date(task.due_date) : new Date(),
      parent: project.id,
      type: "task",
      progress: task.status === "done" ? "better" : task.status === "in_progress" ? "stable" : "worse"
    }));

    return [projectTask, ...subTasks];
  });

  return (
    <div className="h-[600px] w-full">
      <Gantt
        tasks={tasks}
        viewMode={ViewMode.Month}
        onTaskClick={(task) => console.log("Task clicked:", task)}
        taskRenderer={(task) => {
          let bgColor = "bg-gray-200";
          
          if (task.type === "project") {
            switch (task.lifecycle_status) {
              case "in_progress":
                bgColor = "bg-blue-200";
                break;
              case "completed":
                bgColor = "bg-green-200";
                break;
              case "suspended":
                bgColor = "bg-yellow-200";
                break;
              case "abandoned":
                bgColor = "bg-red-200";
                break;
            }
          } else {
            switch (task.progress) {
              case "better":
                bgColor = "bg-green-200";
                break;
              case "stable":
                bgColor = "bg-blue-200";
                break;
              case "worse":
                bgColor = "bg-gray-200";
                break;
            }
          }
          
          return (
            <div className={`px-2 py-1 rounded ${bgColor} truncate`}>
              {task.text}
            </div>
          );
        }}
      />
    </div>
  );
};