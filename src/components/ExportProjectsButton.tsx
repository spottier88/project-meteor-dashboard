import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProjectSelectionTable } from "./ProjectSelectionTable";
import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { MultiProjectPDF } from "./MultiProjectPDF";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { UserRoleData } from "@/types/user";
import { useToast } from "./ui/use-toast";

export const ExportProjectsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { toast } = useToast();
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

  const { data: projectsData } = useQuery({
    queryKey: ["selectedProjects", selectedProjects],
    queryFn: async () => {
      if (selectedProjects.length === 0) return null;

      const fetchProjectData = async (projectId: string) => {
        const projectResult = await supabase.from("projects").select("*").eq("id", projectId).single();
        const [reviewResult, risksResult, tasksResult, poleResult, directionResult, serviceResult] = await Promise.all([
          supabase
            .from("reviews")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("risks").select("*").eq("project_id", projectId),
          supabase.from("tasks").select("*").eq("project_id", projectId),
          supabase.from("poles").select("name").eq("id", projectResult.data.pole_id).maybeSingle(),
          supabase.from("directions").select("name").eq("id", projectResult.data.direction_id).maybeSingle(),
          supabase.from("services").select("name").eq("id", projectResult.data.service_id).maybeSingle(),
        ]);

        return {
          project: {
            ...projectResult.data,
            pole_name: poleResult.data?.name,
            direction_name: directionResult.data?.name,
            service_name: serviceResult.data?.name,
          },
          lastReview: reviewResult.data,
          risks: risksResult.data || [],
          tasks: tasksResult.data || [],
        };
      };

      const projectsData = await Promise.all(selectedProjects.map(fetchProjectData));
      return projectsData;
    },
    enabled: selectedProjects.length > 0,
  });

  const isAdmin = userRoles?.some(role => role.role === "admin");

  if (!isAdmin) return null;

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedProjects(selectedIds);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <FileDown className="h-4 w-4 mr-2" />
          Exporter les projets
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sélectionner les projets à exporter</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <ProjectSelectionTable onSelectionChange={handleSelectionChange} />
          <div className="flex justify-end mt-4">
            {selectedProjects.length > 0 && projectsData && (
              <PDFDownloadLink
                document={<MultiProjectPDF projectsData={projectsData} />}
                fileName="projets-export.pdf"
              >
                {({ loading }) => (
                  <Button disabled={loading}>
                    {loading ? "Génération..." : "Télécharger le PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};