
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusIcon } from "./project/StatusIcon";
import { Project, ProjectStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";
import { ProjectListItem } from "@/hooks/useProjectsListView";

interface ProjectWithStatus {
  id: string;
  title: string;
  status?: ProjectStatus | null;
  weather?: ProjectStatus | null;
  last_review_date?: string | null;
  lastReviewDate?: string | null;
  project_manager?: string;
}

interface ProjectSelectionSheetProps {
  projects: (Project | ProjectListItem)[];
  isOpen: boolean;
  onClose: () => void;
  onProjectSelect: (id: string, title: string) => void;
}

export const ProjectSelectionSheet = ({
  projects,
  isOpen,
  onClose,
  onProjectSelect,
}: ProjectSelectionSheetProps) => {
  const [searchTerm, setSearchTerm] = useState("");
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
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  // Récupérer les projets où l'utilisateur est chef de projet secondaire
  const { data: secondaryManagedProjects } = useQuery({
    queryKey: ["secondaryManagedProjects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id)
        .eq("role", "secondary_manager");
      
      if (error) throw error;
      return data?.map(item => item.project_id) || [];
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(role => role.role === "admin");

  // Filter projects based on user role and search term
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_manager?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    // If admin, show all projects that match search
    if (isAdmin) return matchesSearch;

    // Pour les non-admins, montrer les projets où ils sont chef de projet principal OU secondaire
    return matchesSearch && (
      project.project_manager === user?.email || 
      secondaryManagedProjects?.includes(project.id)
    );
  });

  const getReviewDate = (project: ProjectWithStatus): string | null => {
    // Gérer les deux formats possibles de date de revue
    return project.last_review_date || project.lastReviewDate || null;
  };

  const getStatusForDisplay = (project: ProjectWithStatus): ProjectStatus | null => {
    // Utiliser weather en priorité ou status si weather n'est pas disponible
    return project.weather || project.status || null;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sélectionner un projet</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Input
            placeholder="Rechercher par nom de projet ou chef de projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du projet</TableHead>
                  <TableHead>Chef de projet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière revue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onProjectSelect(project.id, project.title)}
                  >
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.project_manager || "-"}</TableCell>
                    <TableCell>
                      <StatusIcon status={getStatusForDisplay(project)} />
                    </TableCell>
                    <TableCell>{getReviewDate(project)}</TableCell>
                  </TableRow>
                ))}
                {filteredProjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Aucun projet trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
