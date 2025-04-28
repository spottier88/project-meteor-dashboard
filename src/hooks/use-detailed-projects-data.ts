
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useDetailedProjectsData = (projectIds: string[], enabled: boolean = false) => {
  return useQuery({
    queryKey: ["detailedProjects", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return null;

      const fetchProjectData = async (projectId: string) => {
        try {
          const [projectResult, reviewResult] = await Promise.all([
            supabase
              .from("projects")
              .select("*")
              .eq("id", projectId)
              .maybeSingle(),
            supabase
              .from("latest_reviews")
              .select("*")
              .eq("project_id", projectId)
              .maybeSingle()
          ]);

          if (projectResult.error || !projectResult.data) {
            console.error("Error fetching project:", projectResult.error);
            return null;
          }

          // Récupérer les actions de la dernière revue
          let reviewActions = [];
          if (reviewResult.data?.review_id) {
            const { data: actionsData, error: actionsError } = await supabase
              .from("review_actions")
              .select("*")
              .eq("review_id", reviewResult.data.review_id);
              
            if (!actionsError) {
              reviewActions = actionsData || [];
            }
          }

          // Récupérer en parallèle toutes les données associées
          const [
            codeResult,
            framingData,
            innovationData,
            risksResult,
            tasksResult,
            poleResult,
            directionResult,
            serviceResult
          ] = await Promise.all([
            supabase
              .from("project_codes")
              .select("code")
              .eq("project_id", projectId)
              .maybeSingle(),
            supabase
              .from("project_framing")
              .select("*")
              .eq("project_id", projectId)
              .maybeSingle(),
            supabase
              .from("project_innovation_scores")
              .select("*")
              .eq("project_id", projectId)
              .maybeSingle(),
            supabase
              .from("risks")
              .select("*")
              .eq("project_id", projectId),
            supabase
              .from("tasks")
              .select("*")
              .eq("project_id", projectId),
            projectResult.data.pole_id
              ? supabase.from("poles").select("name").eq("id", projectResult.data.pole_id).maybeSingle()
              : { data: null },
            projectResult.data.direction_id
              ? supabase.from("directions").select("name").eq("id", projectResult.data.direction_id).maybeSingle()
              : { data: null },
            projectResult.data.service_id
              ? supabase.from("services").select("name").eq("id", projectResult.data.service_id).maybeSingle()
              : { data: null }
          ]);

          // Récupérer l'information "Pour qui"
          let forEntityName = null;
          if (projectResult.data.for_entity_type && projectResult.data.for_entity_id) {
            const entityType = projectResult.data.for_entity_type;
            const entityId = projectResult.data.for_entity_id;
            
            let entityData = null;
            if (entityType === 'pole') {
              const { data } = await supabase
                .from("poles")
                .select("name")
                .eq("id", entityId)
                .maybeSingle();
              entityData = data;
            } else if (entityType === 'direction') {
              const { data } = await supabase
                .from("directions")
                .select("name")
                .eq("id", entityId)
                .maybeSingle();
              entityData = data;
            } else if (entityType === 'service') {
              const { data } = await supabase
                .from("services")
                .select("name")
                .eq("id", entityId)
                .maybeSingle();
              entityData = data;
            }
            
            forEntityName = entityData?.name || null;
          }

          // Récupérer les informations complètes du chef de projet
          let projectManagerName = null;
          if (projectResult.data.project_manager_id) {
            const { data: managerData } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", projectResult.data.project_manager_id)
              .maybeSingle();
              
            if (managerData) {
              projectManagerName = `${managerData.first_name || ''} ${managerData.last_name || ''}`.trim();
            }
          }

          return {
            project: {
              ...projectResult.data,
              completion: reviewResult.data?.completion || 0,
              weather: reviewResult.data?.weather || null,
              progress: reviewResult.data?.progress || null,
              pole_name: poleResult.data?.name,
              direction_name: directionResult.data?.name,
              service_name: serviceResult.data?.name,
              code: codeResult.data?.code,
              project_manager_name: projectManagerName,
              for_entity_name: forEntityName
            },
            lastReview: reviewResult.data
              ? {
                  weather: reviewResult.data.weather,
                  progress: reviewResult.data.progress,
                  completion: reviewResult.data.completion,
                  comment: reviewResult.data.comment,
                  created_at: reviewResult.data.created_at,
                  actions: reviewActions,
                }
              : undefined,
            framing: framingData?.data || undefined,
            innovation: innovationData?.data || undefined,
            risks: risksResult.data || [],
            tasks: tasksResult.data || [],
          };
        } catch (error) {
          console.error("Error in fetchProjectData:", error);
          return null;
        }
      };

      const results = await Promise.all(projectIds.map(fetchProjectData));
      const validResults = results.filter((result): result is NonNullable<typeof result> => result !== null);
      return validResults;
    },
    enabled: enabled && projectIds.length > 0,
  });
};
