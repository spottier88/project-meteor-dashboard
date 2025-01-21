import { ProjectForm } from "@/components/ProjectForm";
import { ProjectSelectionSheet } from "@/components/ProjectSelectionSheet";
import { ReviewSheet } from "@/components/ReviewSheet";
import { Project } from "@/types/project";

interface ProjectModalsProps {
  isProjectFormOpen: boolean;
  onProjectFormClose: () => void;
  onProjectFormSubmit: (projectData: any) => Promise<void>;
  selectedProject: Project | null;
  isProjectSelectionOpen: boolean;
  onProjectSelectionClose: () => void;
  onProjectSelect: (id: string, title: string) => void;
  projects: Project[];
  isReviewSheetOpen: boolean;
  onReviewClose: () => void;
  selectedProjectForReview: { id: string; title: string; } | null;
  onReviewSubmitted: () => void;
}

export const ProjectModals = ({
  isProjectFormOpen,
  onProjectFormClose,
  onProjectFormSubmit,
  selectedProject,
  isProjectSelectionOpen,
  onProjectSelectionClose,
  onProjectSelect,
  projects,
  isReviewSheetOpen,
  onReviewClose,
  selectedProjectForReview,
  onReviewSubmitted,
}: ProjectModalsProps) => {
  return (
    <>
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={onProjectFormClose}
        onSubmit={onProjectFormSubmit}
        project={selectedProject}
      />

      <ProjectSelectionSheet
        projects={projects || []}
        isOpen={isProjectSelectionOpen}
        onClose={onProjectSelectionClose}
        onProjectSelect={onProjectSelect}
      />

      {selectedProjectForReview && (
        <ReviewSheet
          projectId={selectedProjectForReview.id}
          projectTitle={selectedProjectForReview.title}
          isOpen={isReviewSheetOpen}
          onClose={onReviewClose}
          onReviewSubmitted={onReviewSubmitted}
        />
      )}
    </>
  );
};