import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusIcon } from "./project/StatusIcon";
import { ProjectStatus } from "./ProjectCard";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  lastReviewDate: string;
  project_manager?: string;
}

interface ProjectSelectionSheetProps {
  projects: Project[];
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

  const isAdmin = userRoles?.some(role => role.role === "admin");

  // Filter projects based on user role and search term
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_manager?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    // If admin, show all projects that match search
    if (isAdmin) return matchesSearch;

    // For non-admin users, only show their projects that match search
    return matchesSearch && project.project_manager === user?.email;
  });

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
                      <StatusIcon status={project.status} />
                    </TableCell>
                    <TableCell>{project.lastReviewDate}</TableCell>
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