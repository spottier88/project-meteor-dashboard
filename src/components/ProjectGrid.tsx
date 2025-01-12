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
    
    // Si l'utilisateur est manager, vérifier les assignations
    const hasManagerAccess = isManager && managerAssignments?.some(assignment => {
      // Vérifier d'abord au niveau service si applicable
      if (assignment.service_id && project.service_id) {
        const hasServiceAccess = assignment.service_id === project.service_id;
        console.log("Service level check:", {
          assignedService: assignment.services?.name,
          projectService: project.service_id,
          hasAccess: hasServiceAccess
        });
        return hasServiceAccess;
      }

      // Vérifier au niveau direction si applicable
      if (assignment.direction_id && project.direction_id) {
        const hasDirectionAccess = assignment.direction_id === project.direction_id;
        console.log("Direction level check:", {
          assignedDirection: assignment.directions?.name,
          projectDirection: project.direction_id,
          hasAccess: hasDirectionAccess
        });
        return hasDirectionAccess;
      }

      // Vérifier au niveau pôle si applicable
      if (assignment.pole_id && project.pole_id) {
        const hasPoleAccess = assignment.pole_id === project.pole_id;
        console.log("Pole level check:", {
          assignedPole: assignment.poles?.name,
          projectPole: project.pole_id,
          hasAccess: hasPoleAccess
        });
        return hasPoleAccess;
      }

      return false;
    });

    console.log("Access check result:", {
      isProjectManager,
      hasManagerAccess,
      finalAccess: isProjectManager || hasManagerAccess
    });

    return isProjectManager || hasManagerAccess;
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