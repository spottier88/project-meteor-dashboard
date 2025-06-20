
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Portfolio } from "@/types/portfolio";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectWithExtendedData } from "@/types/project";
import { lifecycleStatusLabels } from "@/types/project";
import { StatusIcon } from "@/components/project/StatusIcon";

interface PortfolioProjectsDialogProps {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio | null;
}

export const PortfolioProjectsDialog = ({ 
  open, 
  onClose, 
  portfolio 
}: PortfolioProjectsDialogProps) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["portfolio-projects", portfolio?.id],
    queryFn: async () => {
      if (!portfolio?.id) return [];
      
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          description,
          status,
          progress,
          lifecycle_status,
          start_date,
          end_date,
          project_manager,
          created_at
        `)
        .eq("portfolio_id", portfolio.id);

      if (error) throw error;
      
      // Transformer les données pour correspondre au type ProjectWithExtendedData
      return (data || []).map(project => ({
        ...project,
        completion: 0, // Valeur par défaut
        lastReviewDate: null // Valeur par défaut
      })) as ProjectWithExtendedData[];
    },
    enabled: !!portfolio?.id && open,
  });

  if (!portfolio) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Projets du portefeuille : {portfolio.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Chargement des projets...</div>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <div className="flex gap-2">
                      {project.status && (
                        <div className="flex items-center gap-1">
                          <StatusIcon status={project.status} />
                        </div>
                      )}
                      <Badge variant="outline">
                        {lifecycleStatusLabels[project.lifecycle_status]}
                      </Badge>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Chef de projet: {project.project_manager || "Non assigné"}</span>
                    {project.start_date && (
                      <span>Début: {new Date(project.start_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucun projet dans ce portefeuille
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
