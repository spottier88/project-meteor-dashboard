
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFrameworkNotes } from "@/hooks/useFrameworkNotes";
import { useToast } from "@/components/ui/use-toast";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { UserInfo } from "@/components/UserInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { FrameworkNoteEdit } from "@/components/project/FrameworkNoteEdit";
import { Separator } from "@/components/ui/separator";

const FrameworkNotes = () => {
  const { isAdmin, hasRole } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canCreateNotes = isAdmin || hasRole('chef_projet');
  
  // État pour gérer le formulaire de nouvelle note
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Récupérer les notes de cadrage
  const { 
    collections, 
    isLoadingCollections, 
    createCollection, 
    deleteCollection,
    getCollectionWithSections 
  } = useFrameworkNotes();

  const handleNewNote = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsEditMode(true);
  };

  const handleViewNote = (noteId: string) => {
    navigate(`/framework-notes/${noteId}`);
  };

  const handleCloseEdit = () => {
    setIsEditMode(false);
    setSelectedNoteId(null);
  };

  const handleCreateNote = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Titre requis",
        description: "Veuillez saisir un titre pour la note de cadrage"
      });
      return;
    }

    try {
      await createCollection({ title, description });
      setIsCreateDialogOpen(false);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la note de cadrage"
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <UserInfo />
      
      <DashboardHeader 
        onNewFrameworkNote={handleNewNote}
      />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Notes de cadrage</h1>
        <p className="text-muted-foreground">
          Créez et gérez les notes de cadrage pour vos projets.
        </p>
      </div>

      <div className="grid gap-6">
        {isLoadingCollections ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card key={collection.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{collection.title}</CardTitle>
                    <Badge variant={collection.status === 'draft' ? 'outline' : 'default'}>
                      {collection.status === 'draft' ? 'Brouillon' : 'Final'}
                    </Badge>
                  </div>
                  {collection.description && (
                    <CardDescription>{collection.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    Créé le {new Date(collection.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={() => handleViewNote(collection.id)}>
                    Consulter
                  </Button>
                  <Button onClick={() => handleEditNote(collection.id)}>
                    Modifier
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-10 border rounded-lg bg-muted/20">
            <FilePlus className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune note de cadrage</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore créé de note de cadrage.
            </p>
            {canCreateNotes && (
              <Button onClick={handleNewNote}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une note de cadrage
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogue de création de note */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle note de cadrage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateNote}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mode d'édition */}
      {isEditMode && selectedNoteId && (
        <FrameworkNoteEdit 
          noteId={selectedNoteId}
          open={isEditMode}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};

export default FrameworkNotes;
