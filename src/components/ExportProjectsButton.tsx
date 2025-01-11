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
        
        const [reviewResult, risksResult, tasksResult] = await Promise.all([
          supabase
            .from("reviews")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("risks").select("*").eq("project_id", projectId),
          supabase.from("tasks").select("*").eq("project_id", projectId),
        ]);

        const [poleResult, directionResult, serviceResult] = await Promise.all([
          projectResult.data.pole_id 
            ? supabase.from("poles").select("name").eq("id", projectResult.data.pole_id).maybeSingle()
            : Promise.resolve({ data: null }),
          projectResult.data.direction_id
            ? supabase.from("directions").select("name").eq("id", projectResult.data.direction_id).maybeSingle()
            : Promise.resolve({ data: null }),
          projectResult.data.service_id
            ? supabase.from("services").select("name").eq("id", projectResult.data.service_id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        return {
          project: {
            title: projectResult.data.title,
            status: projectResult.data.status,
            progress: projectResult.data.progress,
            completion: projectResult.data.completion,
            project_manager: projectResult.data.project_manager,
            last_review_date: projectResult.data.last_review_date,
            start_date: projectResult.data.start_date,
            end_date: projectResult.data.end_date,
            pole_name: poleResult.data?.name,
            direction_name: directionResult.data?.name,
            service_name: serviceResult.data?.name,
          },
          lastReview: reviewResult.data ? {
            weather: reviewResult.data.weather,
            progress: reviewResult.data.progress,
            comment: reviewResult.data.comment,
            created_at: reviewResult.data.created_at,
          } : undefined,
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
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                {({ loading }) => (
                  loading ? "Génération..." : "Télécharger le PDF"
                )}
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};