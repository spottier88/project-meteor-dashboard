
/**
 * @component ProjectModals
 * @description Gestionnaire central pour tous les modales liés aux projets.
 * Regroupe les modales de formulaire de projet, de sélection de projet et
 * de revue de projet. Permet une gestion unifiée des états d'ouverture/fermeture.
 */

import { ProjectForm } from "@/components/ProjectForm";
import { ProjectSelectionSheet } from "@/components/ProjectSelectionSheet";
import { ReviewSheet } from "@/components/review/ReviewSheet";
import { Project } from "@/types/project";

interface ProjectModalsProps {
  isProjectFormOpen: boolean;
  onProjectFormClose: () => void;
  onProjectFormSubmit: (projectData: any) => Promise<any>;
  selectedProject: Project | null;
  isProjectSelectionOpen: boolean;
  onProjectSelectionClose: () => void;
  onProjectSelect: (id: string, title: string) => void;
  isReviewSheetOpen: boolean;
  onReviewClose: () => void;
  selectedProjectForReview: { id: string; title: string; } | null;
  onReviewSubmitted: () => void;
  existingReview?: {
    id: string;
    created_at: string;
  };
}

export const ProjectModals = ({
  isProjectFormOpen,
  onProjectFormClose,
  onProjectFormSubmit,
  selectedProject,
  isProjectSelectionOpen,
  onProjectSelectionClose,
  onProjectSelect,
  isReviewSheetOpen,
  onReviewClose,
  selectedProjectForReview,
  onReviewSubmitted,
  existingReview,
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
          existingReview={existingReview}
        />
      )}
    </>
  );
};
