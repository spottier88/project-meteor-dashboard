
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrameworkNoteGenerator } from "./FrameworkNoteGenerator";
import { FrameworkNotesList } from "./FrameworkNotesList";
import { FrameworkNoteDialog } from "./FrameworkNoteDialog";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface FrameworkNoteSectionProps {
  project: Project;
  canEdit: boolean;
}

export const FrameworkNoteSection = ({ project, canEdit }: FrameworkNoteSectionProps) => {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewNote = (note: any) => {
    setSelectedNote(note);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Notes de cadrage</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Notes sauvegardées</TabsTrigger>
          {canEdit && <TabsTrigger value="generator">Générer une note</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="list">
          <FrameworkNotesList projectId={project.id} onViewNote={handleViewNote} />
        </TabsContent>
        
        {canEdit && (
          <TabsContent value="generator">
            <FrameworkNoteGenerator project={project} />
          </TabsContent>
        )}
      </Tabs>
      
      <FrameworkNoteDialog 
        note={selectedNote}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};
