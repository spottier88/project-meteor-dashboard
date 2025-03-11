
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Link } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface StandaloneFrameworkNoteLinkDialogProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneFrameworkNoteLinkDialog: React.FC<StandaloneFrameworkNoteLinkDialogProps> = ({ 
  note, 
  isOpen, 
  onClose 
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [activeTab, setActiveTab] = useState('link');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, created_at, project_manager, status, lifecycle_status')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les projets',
        });
        throw error;
      }

      return data || [];
    },
    enabled: isOpen,
  });

  const filteredProjects = projects?.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkToProject = async () => {
    if (!selectedProjectId) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner un projet',
      });
      return;
    }

    setIsLinking(true);
    try {
      // Créer une copie de la note avec le projet_id
      const { data, error } = await supabase
        .from('project_framework_notes')
        .insert({
          content: note.content,
          status: note.status,
          version: note.version,
          title: note.title,
          project_id: selectedProjectId,
          standalone: false
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Note liée',
        description: 'La note de cadrage a été liée au projet avec succès',
      });
      
      onClose();
      navigate(`/framework-notes/${selectedProjectId}`);
    } catch (error) {
      console.error('Erreur lors de la liaison:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de lier la note au projet',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let variant = "outline";
    
    switch (status) {
      case "active":
        variant = "default";
        break;
      case "completed":
        variant = "secondary";
        break;
      case "on_hold":
        variant = "warning";
        break;
      case "cancelled":
        variant = "destructive";
        break;
    }
    
    return (
      <Badge variant={variant as any}>
        {status === "active" ? "Actif" : 
         status === "completed" ? "Terminé" : 
         status === "on_hold" ? "En pause" : 
         status === "cancelled" ? "Annulé" : status}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Lier la note à un projet
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="link">Lier à un projet existant</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="flex-grow flex flex-col space-y-4">
            <Alert className="mb-4">
              <AlertTitle>Note: {note?.title || 'Sans titre'}</AlertTitle>
              <AlertDescription>
                Sélectionnez un projet auquel vous souhaitez lier cette note. 
                Une copie de la note sera associée au projet sélectionné.
              </AlertDescription>
            </Alert>

            <div className="mb-4">
              <Input
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <ScrollArea className="flex-grow">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !filteredProjects?.length ? (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Aucun projet trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredProjects.map((project) => (
                    <Card 
                      key={project.id} 
                      className={`cursor-pointer transition ${selectedProjectId === project.id ? 'border-primary' : ''}`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="flex justify-between items-start">
                          <span>{project.title}</span>
                          {getStatusBadge(project.status)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Créé le {format(new Date(project.created_at), 'dd/MM/yyyy')}
                          {project.project_manager && (
                            <div>Chef de projet: {project.project_manager}</div>
                          )}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={handleLinkToProject} 
            disabled={isLinking || !selectedProjectId}
          >
            {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lier au projet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
