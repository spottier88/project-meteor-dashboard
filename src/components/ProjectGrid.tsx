import { ProjectCard } from "./ProjectCard";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
  project_manager?: string;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
  lifecycle_status: ProjectLifecycleStatus;
}

interface ProjectGridProps {
  projects: Project[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onFilteredProjectsChange?: (projectIds: string[]) => void;
}

export const ProjectGrid = ({
  projects,
  onProjectReview,
  onProjectEdit,
  onViewHistory,
  onFilteredProjectsChange,
}: ProjectGridProps) => {
  const user = useUser();

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      console.log("User roles:", data);
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      console.log("User profile:", data);
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: filteredProjects } = useQuery({
    queryKey: ["filteredProjects", projects, user?.id, userRoles, userProfile],
    queryFn: async () => {
      if (!user) {
        console.log("No user logged in");
        return [];
      }

      const isAdmin = userRoles?.some(role => role.role === "admin");
      if (isAdmin) {
        console.log("User is admin, showing all projects");
        return projects;
      }

      const filteredResults = await Promise.all(
        projects.map(async project => {
          const isProjectManager = project.project_manager === userProfile?.email;
          
          if (isProjectManager) {
            console.log(`Project ${project.id} accessible (project manager)`);
            return true;
          }

          const { data: canAccess, error } = await supabase
            .rpc('can_manager_access_project', {
              p_user_id: user.id,
              p_project_id: project.id
            });

          if (error) {
            console.error("Error checking project access:", error);
            return false;
          }

          let projectLevel = "Non défini";
          if (project.service_id) {
            projectLevel = "Service";
          } else if (project.direction_id) {
            projectLevel = "Direction";
          } else if (project.pole_id) {
            projectLevel = "Pôle";
          }

          console.log(`Project ${project.id} - ${project.title}:`, {
            projectLevel,
            hierarchyDetails: {
              pole_id: project.pole_id,
              direction_id: project.direction_id,
              service_id: project.service_id
            },
            access: {
              isProjectManager,
              canAccess,
              userEmail: userProfile?.email,
              projectManager: project.project_manager
            },
            userRoles: userRoles?.map(r => r.role)
          });

          return canAccess;
        })
      );

      return projects.filter((_, index) => filteredResults[index]);
    },
    enabled: !!user?.id && !!userRoles && !!userProfile,
  });

  // Notifier le parent des projets filtrés
  React.useEffect(() => {
    if (filteredProjects && onFilteredProjectsChange) {
      onFilteredProjectsChange(filteredProjects.map(project => project.id));
    }
  }, [filteredProjects, onFilteredProjectsChange]);

  if (!filteredProjects) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <ProjectCard
          key={project.id}
          {...project}
          onReview={onProjectReview}
          onEdit={onProjectEdit}
          onViewHistory={onViewHistory}
        />
      ))}
    </div>
  );
};