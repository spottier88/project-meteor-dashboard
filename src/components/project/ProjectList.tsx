import { ViewMode } from "@/components/ViewToggle";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { ViewToggle } from "@/components/ViewToggle";

interface ProjectListProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  projects: any[];
  onProjectEdit: (id: string) => void;
  onProjectReview: (id: string, title: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
  onFilteredProjectsChange?: (projectIds: string[]) => void;
}

export const ProjectList = ({
  view,
  onViewChange,
  projects,
  onProjectEdit,
  onProjectReview,
  onViewHistory,
  onProjectDeleted,
  onFilteredProjectsChange,
}: ProjectListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ViewToggle currentView={view} onViewChange={onViewChange} />
      </div>
      {view === "grid" ? (
        <ProjectGrid
          projects={projects}
          onProjectEdit={onProjectEdit}
          onProjectReview={onProjectReview}
          onViewHistory={onViewHistory}
          onFilteredProjectsChange={onFilteredProjectsChange}
        />
      ) : (
        <ProjectTable
          projects={projects}
          onProjectReview={onProjectReview}
          onProjectEdit={onProjectEdit}
          onViewHistory={onViewHistory}
          onProjectDeleted={onProjectDeleted}
          onFilteredProjectsChange={onFilteredProjectsChange}
        />
      )}
    </div>
  );
};