import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { MonitoringLevel } from "@/types/monitoring";
import { ForEntityType, ProjectLifecycleStatus } from "@/types/project";

export interface ProjectFormData {
  title: string;
  description: string;
  projectManager: string;
  startDate?: Date;
  endDate?: Date;
  priority: string;
  monitoringLevel: MonitoringLevel;
  monitoringEntityId: string | null;
  owner_id: string | null;
  poleId: string;
  directionId: string;
  serviceId: string;
  lifecycleStatus: ProjectLifecycleStatus;
  for_entity_type: ForEntityType;
  for_entity_id: string | undefined;
  innovation: {
    novateur: number;
    usager: number;
    ouverture: number;
    agilite: number;
    impact: number;
  };
  framing: {
    context: string;
    stakeholders: string;
    governance: string;
    objectives: string;
    timeline: string;
    deliverables: string;
  };
}

export const useProjectFormHandlers = (selectedProject: any) => {
  const user = useUser();

  const handleProjectFormSubmit = async (projectData: ProjectFormData) => {
    try {
      const projectPayload = {
        title: projectData.title,
        description: projectData.description,
        project_manager: projectData.projectManager,
        start_date: projectData.startDate?.toISOString().split('T')[0],
        end_date: projectData.endDate?.toISOString().split('T')[0],
        priority: projectData.priority,
        owner_id: projectData.owner_id,
        pole_id: projectData.poleId === "none" ? null : projectData.poleId,
        direction_id: projectData.directionId === "none" ? null : projectData.directionId,
        service_id: projectData.serviceId === "none" ? null : projectData.serviceId,
        lifecycle_status: projectData.lifecycleStatus,
        for_entity_type: projectData.for_entity_type,
        for_entity_id: projectData.for_entity_id,
      };

      await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      let projectId: string | undefined;

      if (selectedProject?.id) {
        const { error: projectError } = await supabase
          .from('projects')
          .update(projectPayload)
          .eq('id', selectedProject.id)
          .select();

        if (projectError) {
          console.error("[ProjectForm] Project update error:", projectError);
          throw projectError;
        }

        projectId = selectedProject.id;

        const { error: innovationError } = await supabase
          .from('project_innovation_scores')
          .upsert(
            {
              project_id: selectedProject.id,
              ...projectData.innovation,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'project_id' }
          )
          .select();

        if (innovationError) {
          console.error("[ProjectForm] Innovation scores update error:", innovationError);
          throw innovationError;
        }

        const { error: monitoringError } = await supabase
          .from('project_monitoring')
          .upsert(
            {
              project_id: selectedProject.id,
              monitoring_level: projectData.monitoringLevel,
              monitoring_entity_id: projectData.monitoringEntityId,
            },
            { onConflict: 'project_id' }
          )
          .select();

        if (monitoringError) {
          console.error("[ProjectForm] Monitoring update error:", monitoringError);
          throw monitoringError;
        }
      } else {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert(projectPayload)
          .select()
          .single();

        if (projectError) {
          console.error("[ProjectForm] Project creation error:", projectError.message);
          console.error("[ProjectForm] Project creation error details:", projectError);
          throw projectError;
        }

        projectId = newProject.id;

        const { error: innovationError } = await supabase
          .from('project_innovation_scores')
          .insert({
            project_id: newProject.id,
            ...projectData.innovation,
          })
          .select();

        if (innovationError) {
          console.error("[ProjectForm] Innovation scores creation error:", innovationError.message);
          console.error("[ProjectForm] Innovation scores creation error details:", innovationError);
          throw innovationError;
        }

        const { error: monitoringError } = await supabase
          .from('project_monitoring')
          .insert({
            project_id: newProject.id,
            monitoring_level: projectData.monitoringLevel,
            monitoring_entity_id: projectData.monitoringEntityId,
          })
          .select();

        if (monitoringError) {
          console.error("[ProjectForm] Monitoring creation error:", monitoringError.message);
          console.error("[ProjectForm] Monitoring creation error details:", monitoringError);
          throw monitoringError;
        }
      }

      if (projectId) {
        const { data: existingFraming, error: checkFramingError } = await supabase
          .from('project_framing')
          .select('id')
          .eq('project_id', projectId)
          .maybeSingle();

        if (checkFramingError) {
          console.error("[ProjectForm] Error checking existing framing:", checkFramingError);
          throw checkFramingError;
        }

        const framingData = {
          project_id: projectId,
          context: projectData.framing.context,
          stakeholders: projectData.framing.stakeholders,
          governance: projectData.framing.governance,
          objectives: projectData.framing.objectives,
          timeline: projectData.framing.timeline,
          deliverables: projectData.framing.deliverables,
        };

        if (existingFraming) {
          const { error: updateFramingError } = await supabase
            .from('project_framing')
            .update(framingData)
            .eq('id', existingFraming.id)
            .select();

          if (updateFramingError) {
            console.error("[ProjectForm] Error updating framing data:", updateFramingError);
            throw updateFramingError;
          }
        } else {
          const { error: insertFramingError } = await supabase
            .from('project_framing')
            .insert(framingData)
            .select();

          if (insertFramingError) {
            console.error("[ProjectForm] Error inserting framing data:", insertFramingError);
            throw insertFramingError;
          }
        }
      } else {
        console.error("[ProjectForm] No project ID available to save framing data");
      }

      return { id: projectId };
    } catch (error) {
      console.error("[ProjectForm] Operation failed:", error);
      throw error;
    }
  };

  return { handleProjectFormSubmit };
};

