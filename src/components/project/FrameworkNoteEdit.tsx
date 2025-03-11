
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, Plus, Save, Trash } from "lucide-react";
import { useFrameworkNotes } from "@/hooks/useFrameworkNotes";
import { useToast } from "@/components/ui/use-toast";
import { FrameworkNoteSection } from "./FrameworkNoteSection";
import { SECTION_LABELS, SectionType } from "@/types/framework-note";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FrameworkNoteEditProps {
  noteId: string;
  open: boolean;
  onClose: () => void;
}

export const FrameworkNoteEdit = ({ noteId, open, onClose }: FrameworkNoteEditProps) => {
  const { toast } = useToast();
  const { 
    getCollectionWithSections, 
    updateCollection, 
    addSection, 
    updateSection, 
    deleteSection 
  } = useFrameworkNotes();

  const [collection, setCollection] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "final">("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [newSectionType, setNewSectionType] = useState<SectionType>("objectifs");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (open && noteId) {
        setIsLoading(true);
        try {
          const data = await getCollectionWithSections(noteId);
          setCollection(data.collection);
          setSections(data.sections);
          setTitle(data.collection.title);
          setDescription(data.collection.description || "");
          setStatus(data.collection.status as "draft" | "final");
        } catch (error) {
          console.error("Erreur lors du chargement des données:", error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger la note de cadrage"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [noteId, open, getCollectionWithSections, toast]);
  
  const handleSaveNote = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Titre requis",
        description: "Veuillez saisir un titre pour la note de cadrage"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await updateCollection({
        id: noteId,
        title,
        description: description || null,
        status
      });
      toast({
        title: "Note enregistrée",
        description: "La note de cadrage a été enregistrée avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer la note de cadrage"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionContent.trim()) {
      toast({
        variant: "destructive",
        title: "Contenu requis",
        description: "Veuillez saisir le contenu de la section"
      });
      return;
    }
    
    setIsAddingSection(true);
    try {
      await addSection({
        collectionId: noteId,
        sectionType: newSectionType,
        content: newSectionContent
      });
      setNewSectionContent("");
      // Recharger les sections
      const data = await getCollectionWithSections(noteId);
      setSections(data.sections);
      toast({
        title: "Section ajoutée",
        description: "La section a été ajoutée avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la section:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter la section"
      });
    } finally {
      setIsAddingSection(false);
    }
  };
  
  const handleUpdateSection = async (id: string, content: string) => {
    try {
      await updateSection({ id, content });
      // Mettre à jour les sections localement
      setSections(sections.map(section => 
        section.id === id ? { ...section, content } : section
      ));
      toast({
        title: "Section mise à jour",
        description: "La section a été mise à jour avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la section:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la section"
      });
    }
  };
  
  const handleDeleteSection = async (id: string) => {
    try {
      await deleteSection({ id, collectionId: noteId });
      // Mettre à jour les sections localement
      setSections(sections.filter(section => section.id !== id));
      toast({
        title: "Section supprimée",
        description: "La section a été supprimée avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la section:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la section"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Éditer la note de cadrage</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la note de cadrage et ses sections
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="addSection">Ajouter une section</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1">
                <TabsContent value="general" className="space-y-4 p-1">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titre de la note de cadrage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnelle)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description de la note de cadrage"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "final")}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="sections" className="space-y-4 p-1">
                  {sections.length === 0 ? (
                    <div className="text-center p-6 border rounded bg-muted/20">
                      <p className="text-muted-foreground">Aucune section n'a été ajoutée.</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setActiveTab("addSection")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une section
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sections.map((section) => (
                        <FrameworkNoteSection
                          key={section.id}
                          section={section}
                          onUpdate={(content) => handleUpdateSection(section.id, content)}
                          onDelete={() => handleDeleteSection(section.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="addSection" className="space-y-4 p-1">
                  <div className="space-y-2">
                    <Label htmlFor="sectionType">Type de section</Label>
                    <Select value={newSectionType} onValueChange={(value) => setNewSectionType(value as SectionType)}>
                      <SelectTrigger id="sectionType">
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SECTION_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sectionContent">Contenu</Label>
                    <Textarea
                      id="sectionContent"
                      value={newSectionContent}
                      onChange={(e) => setNewSectionContent(e.target.value)}
                      placeholder="Contenu de la section"
                      rows={10}
                    />
                  </div>
                  <Button 
                    onClick={handleAddSection} 
                    disabled={isAddingSection || !newSectionContent.trim()}
                    className="w-full"
                  >
                    {isAddingSection ? (
                      <>Ajout en cours...</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter cette section
                      </>
                    )}
                  </Button>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            <DialogFooter className="pt-4 border-t mt-4">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Fermer
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={isSaving || !title.trim()}
              >
                {isSaving ? (
                  <>Enregistrement...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
