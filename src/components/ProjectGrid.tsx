import { ProjectCard, ProjectStatus, ProgressStatus } from "./ProjectCard";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
}

interface ProjectGridProps {
  projects: Project[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
}

export const ProjectGrid = ({ projects, onProjectReview, onProjectEdit }: ProjectGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          {...project}
          onReview={onProjectReview}
          onEdit={onProjectEdit}
        />
      ))}
    </div>
  );
};