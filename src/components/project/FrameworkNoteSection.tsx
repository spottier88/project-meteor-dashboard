
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrameworkNoteGenerator } from "./FrameworkNoteGenerator";
import { FrameworkNotesList } from "./FrameworkNotesList";
import { FrameworkNoteDialog } from "./FrameworkNoteDialog";
import { FrameworkNoteEdit } from "./FrameworkNoteEdit";
import { FrameworkNotePdf } from "./FrameworkNotePdf";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);

  const handleViewNote = (note: any) => {
    setSelectedNote(note);
    setIsDialogOpen(true);
  };

  const handleEditNote = (note: any) => {
    setSelectedNote(note);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notes de cadrage</h2>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsPdfDialogOpen(true)}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exporter en PDF
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Notes sauvegardées</TabsTrigger>
          {canEdit && <TabsTrigger value="generator">Générer une note</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="list">
          <FrameworkNotesList 
            projectId={project.id} 
            onViewNote={handleViewNote} 
            onEditNote={handleEditNote}
            canEdit={canEdit}
          />
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

      {canEdit && (
        <FrameworkNoteEdit
          note={selectedNote}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          projectId={project.id}
        />
      )}

      <FrameworkNotePdf
        isOpen={isPdfDialogOpen}
        onClose={() => setIsPdfDialogOpen(false)}
        projectId={project.id}
      />
    </div>
  );
};
