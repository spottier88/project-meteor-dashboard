import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusIcon } from "./project/StatusIcon";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";
import type { MultiProjectPDFProps } from "./MultiProjectPDF";

interface ProjectSelectionSheetProps {
  projects: MultiProjectPDFProps["projectsData"];
  isOpen: boolean;
  onClose: () => void;
  onProjectSelect: (selectedData: MultiProjectPDFProps["projectsData"]) => void;
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

  const filteredProjects = projects.filter((project) => {
    if (!project.project) return false;
    
    const matchesSearch = 
      project.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project.project_manager?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    if (isAdmin) return matchesSearch;
    return matchesSearch && project.project.project_manager === user?.email;
  });

  const handleProjectSelect = (selectedProject: MultiProjectPDFProps["projectsData"][0]) => {
    onProjectSelect([selectedProject]);
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
                    key={project.project.title}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleProjectSelect(project)}
                  >
                    <TableCell className="font-medium">{project.project.title}</TableCell>
                    <TableCell>{project.project.project_manager || "-"}</TableCell>
                    <TableCell>
                      <StatusIcon status={project.project.status} />
                    </TableCell>
                    <TableCell>{project.project.last_review_date}</TableCell>
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