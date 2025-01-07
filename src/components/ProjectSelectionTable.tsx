import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { StatusIcon } from "./project/StatusIcon";
import { ProjectStatus } from "./ProjectCard";

interface ProjectSelectionTableProps {
  onSelectionChange: (selectedIds: string[]) => void;
}

export const ProjectSelectionTable = ({ onSelectionChange }: ProjectSelectionTableProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProjects = projects?.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_manager?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelectedIds = filteredProjects?.map((p) => p.id) || [];
      setSelectedIds(newSelectedIds);
      onSelectionChange(newSelectedIds);
    } else {
      setSelectedIds([]);
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    const newSelectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);
    setSelectedIds(newSelectedIds);
    onSelectionChange(newSelectedIds);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher par nom de projet ou chef de projet..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredProjects?.length === selectedIds.length &&
                    filteredProjects?.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Nom du projet</TableHead>
              <TableHead>Chef de projet</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects?.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(project.id)}
                    onCheckedChange={(checked) => handleSelectOne(checked as boolean, project.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>{project.project_manager || "-"}</TableCell>
                <TableCell>
                  <StatusIcon status={project.status as ProjectStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};