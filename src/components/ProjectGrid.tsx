import { ProjectCard, ProjectStatus, ProgressStatus } from "./ProjectCard";
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
}

interface ProjectGridProps {
  projects: Project[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
}

export const ProjectGrid = ({
  projects,
  onProjectReview,
  onProjectEdit,
  onViewHistory,
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

  const { data: managerAssignments } = useQuery({
    queryKey: ["managerAssignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("manager_assignments")
        .select(`
          *,
          poles:pole_id (
            id,
            name
          ),
          directions:direction_id (
            id,
            name,
            pole_id
          ),
          services:service_id (
            id,
            name,
            direction_id
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      console.log("Manager assignments with full hierarchy:", data);
      return data;
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(role => role.role === "admin");
  const isManager = userRoles?.some(role => role.role === "manager");

  // Filter projects for project managers and managers
  const filteredProjects = projects.filter(project => {
    if (!user) return false;
    if (isAdmin) return true;

    console.log("Checking project:", project.title);
    console.log("Project manager:", project.project_manager);
    console.log("User email:", user.email);
    
    // Si l'utilisateur est le chef de projet
    const isProjectManager = project.project_manager === user.email;
    
    // Si l'utilisateur est manager, vérifier les affectations
    let hasManagerAccess = false;
    
    if (isManager && managerAssignments) {
      // Vérifier le niveau approprié en fonction de l'affectation du projet
      if (project.service_id) {
        // Si le projet est affecté à un service, vérifier uniquement les affectations service
        hasManagerAccess = managerAssignments.some(assignment => 
          assignment.service_id === project.service_id
        );
        console.log("Service level access check:", {
          projectService: project.service_id,
          hasAccess: hasManagerAccess
        });
      } else if (project.direction_id) {
        // Si le projet est affecté à une direction, vérifier uniquement les affectations direction
        hasManagerAccess = managerAssignments.some(assignment => 
          assignment.direction_id === project.direction_id
        );
        console.log("Direction level access check:", {
          projectDirection: project.direction_id,
          hasAccess: hasManagerAccess
        });
      } else if (project.pole_id) {
        // Si le projet est affecté à un pôle, vérifier uniquement les affectations pôle
        hasManagerAccess = managerAssignments.some(assignment => 
          assignment.pole_id === project.pole_id
        );
        console.log("Pole level access check:", {
          projectPole: project.pole_id,
          hasAccess: hasManagerAccess
        });
      }
    }

    console.log("Access check result:", {
      isProjectManager,
      hasManagerAccess,
      finalAccess: isProjectManager || (hasManagerAccess === true)
    });

    return isProjectManager || (hasManagerAccess === true);
  });

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