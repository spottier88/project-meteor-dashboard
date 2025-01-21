import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { Project } from "@/types/project";

interface ProjectListProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  projects: Project[];
  onProjectEdit: (id: string) => void;
  onProjectReview: (id: string, title: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
}

export const ProjectList = ({
  view,
  onViewChange,
  projects,
  onProjectEdit,
  onProjectReview,
  onViewHistory,
  onProjectDeleted,
}: ProjectListProps) => {
  return (
    <>
      <ViewToggle currentView={view} onViewChange={onViewChange} />
      {view === "grid" ? (
        <ProjectGrid 
          projects={projects} 
          onProjectEdit={onProjectEdit}
          onProjectReview={onProjectReview}
          onViewHistory={onViewHistory}
        />
      ) : (
        <ProjectTable 
          projects={projects} 
          onProjectEdit={onProjectEdit}
          onProjectReview={onProjectReview}
          onViewHistory={onViewHistory}
          onProjectDeleted={onProjectDeleted}
        />
      )}
    </>
  );
};