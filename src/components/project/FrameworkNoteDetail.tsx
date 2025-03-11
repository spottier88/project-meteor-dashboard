
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFrameworkNotes } from "@/hooks/useFrameworkNotes";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Edit, Printer, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionType, SECTION_LABELS } from "@/types/framework-note";
import { FrameworkNoteEdit } from "./FrameworkNoteEdit";

export const FrameworkNoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCollectionWithSections } = useFrameworkNotes();
  
  const [collection, setCollection] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getCollectionWithSections(id);
        setCollection(data.collection);
        setSections(data.sections);
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
    };
    
    loadData();
  }, [id, getCollectionWithSections, toast]);
  
  const handleEditNote = () => {
    setIsEditing(true);
  };
  
  const handleCloseEdit = async () => {
    setIsEditing(false);
    // Recharger les données après l'édition
    if (id) {
      try {
        const data = await getCollectionWithSections(id);
        setCollection(data.collection);
        setSections(data.sections);
      } catch (error) {
        console.error("Erreur lors du rechargement des données:", error);
      }
    }
  };
  
  // Grouper les sections par type pour l'affichage
  const groupedSections: Record<SectionType, any[]> = {} as Record<SectionType, any[]>;
  
  sections.forEach(section => {
    if (!groupedSections[section.section_type]) {
      groupedSections[section.section_type] = [];
    }
    groupedSections[section.section_type].push(section);
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl font-semibold mb-2">Note de cadrage introuvable</h2>
        <Button onClick={() => navigate('/framework-notes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux notes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/framework-notes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">{collection.title}</h1>
          <Badge variant={collection.status === 'draft' ? 'outline' : 'default'}>
            {collection.status === 'draft' ? 'Brouillon' : 'Final'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditNote}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>
      
      {collection.description && (
        <div className="mb-6">
          <p className="text-muted-foreground">{collection.description}</p>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex items-center text-sm text-muted-foreground">
          <p>Créé le {new Date(collection.created_at).toLocaleDateString('fr-FR')}</p>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <p>Dernière modification le {new Date(collection.updated_at).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
      
      {sections.length === 0 ? (
        <div className="text-center p-10 border rounded bg-muted/20">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune section</h3>
          <p className="text-muted-foreground mb-4">
            Cette note de cadrage ne contient pas encore de sections.
          </p>
          <Button onClick={handleEditNote}>
            <Edit className="mr-2 h-4 w-4" />
            Ajouter des sections
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(SECTION_LABELS).map(([type, label]) => {
            const typeSections = groupedSections[type as SectionType] || [];
            if (typeSections.length === 0) return null;
            
            return (
              <div key={type} className="space-y-4">
                <h2 className="text-xl font-semibold">{label}</h2>
                {typeSections.map((section) => (
                  <Card key={section.id}>
                    <CardContent className="pt-6">
                      <div className="whitespace-pre-wrap">
                        {section.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
      
      {isEditing && id && (
        <FrameworkNoteEdit
          noteId={id}
          open={isEditing}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};
