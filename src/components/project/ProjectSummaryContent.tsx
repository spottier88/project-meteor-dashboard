
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectSummaryHeader } from "./ProjectSummaryHeader";
import { ProjectSummaryActions } from "./ProjectSummaryActions";
import { TaskSummary } from "@/components/TaskSummary";
import { RiskSummary } from "@/components/RiskSummary";
import { LastReview } from "@/components/LastReview";
import { FrameworkNoteSection } from "./FrameworkNoteSection";

export const ProjectSummaryContent = ({ 
  project, 
  lastReview, 
  risks, 
  tasks,
  isProjectManager,
  isAdmin,
  canEdit
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <ProjectHeader project={project} />
        <ProjectSummaryActions 
          project={project}
          isProjectManager={isProjectManager}
          isAdmin={isAdmin}
          canEdit={canEdit}
        />
      </div>

      <ProjectSummaryHeader 
        project={project} 
        lastReview={lastReview} 
      />

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="risks">Risques</TabsTrigger>
          <TabsTrigger value="reviews">Revues</TabsTrigger>
          <TabsTrigger value="framework">Notes de cadrage</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-6">
          <TaskSummary 
            tasks={tasks} 
            projectId={project.id} 
            canAdd={canEdit}
          />
        </TabsContent>
        <TabsContent value="risks" className="mt-6">
          <RiskSummary 
            risks={risks} 
            projectId={project.id} 
            canAdd={canEdit}
          />
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <LastReview 
            projectId={project.id} 
            lastReview={lastReview}
            canAdd={canEdit}
          />
        </TabsContent>
        <TabsContent value="framework" className="mt-6">
          <FrameworkNoteSection
            project={project}
            canEdit={canEdit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
