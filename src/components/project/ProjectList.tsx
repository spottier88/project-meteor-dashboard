import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { Project } from "@/types/project";

interface ProjectListProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  projects: any[];
  onProjectEdit: (projectId: string) => void;
  onProjectReview: (projectId: string, title: string) => void;
  onViewHistory: (projectId: string, title: string) => void;
  onProjectDeleted: () => void;
  onTeamManagement: (projectId: string) => void;
}

export const ProjectList = ({
  view,
  onViewChange,
  projects,
  onProjectEdit,
  onProjectReview,
  onViewHistory,
  onProjectDeleted,
  onTeamManagement,
}: ProjectListProps) => {
  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>
      {view === "grid" ? (
        <ProjectGrid
          projects={projects}
          onEdit={onProjectEdit}
          onReview={onProjectReview}
          onViewHistory={onViewHistory}
          onDeleted={onProjectDeleted}
          onTeamManagement={onTeamManagement}
        />
      ) : (
        <ProjectTable
          projects={projects}
          onEdit={onProjectEdit}
          onReview={onProjectReview}
          onViewHistory={onViewHistory}
          onDeleted={onProjectDeleted}
          onTeamManagement={onTeamManagement}
        />
      )}
    </div>
  );
};