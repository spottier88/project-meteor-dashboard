
import React, { useState } from "react";
import { useFrameworkNotes } from "@/hooks/useFrameworkNotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Trash2, Eye, Edit, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { FrameworkNoteCollection } from "@/types/framework-note";
import { UserInfo } from "@/components/UserInfo";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

export const FrameworkNotes = () => {
  const { 
    collections, 
    isLoadingCollections, 
    createCollection,
    deleteCollection
  } = useFrameworkNotes();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  
  const handleCreateCollection = () => {
    if (!newCollectionTitle.trim()) return;
    
    createCollection({
      title: newCollectionTitle,
      description: newCollectionDescription
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewCollectionTitle("");
        setNewCollectionDescription("");
      }
    });
  };
  
  const handleDeleteCollection = () => {
    if (!collectionToDelete) return;
    
    deleteCollection(collectionToDelete, {
      onSuccess: () => {
        setCollectionToDelete(null);
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <UserInfo />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notes de cadrage</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle note de cadrage
        </Button>
      </div>
      
      {isLoadingCollections ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections && collections.length > 0 ? (
            collections.map((collection) => (
              <Card key={collection.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-xl truncate">{collection.title}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/framework-notes/${collection.id}`}>
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/framework-notes/${collection.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </a>
                      </Button>
                      <AlertDialog 
                        open={collectionToDelete === collection.id} 
                        onOpenChange={(open) => !open && setCollectionToDelete(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setCollectionToDelete(collection.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette note de cadrage ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. La note de cadrage et toutes ses sections seront définitivement supprimées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteCollection}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                  <CardDescription className="flex justify-between">
                    <span>Créée le {formatDate(collection.created_at)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      collection.status === 'draft' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {collection.status === 'draft' ? 'Brouillon' : 'Finalisée'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {collection.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {collection.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Aucune description
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`/framework-notes/${collection.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Voir la note de cadrage
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune note de cadrage trouvée</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une note de cadrage
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Dialog pour créer une nouvelle note de cadrage */}
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
                placeholder="Titre de la note de cadrage"
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                placeholder="Description de la note de cadrage"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCollection}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FrameworkNotes;
