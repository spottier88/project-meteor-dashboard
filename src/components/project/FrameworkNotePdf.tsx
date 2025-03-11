
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface FrameworkNotePdfProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const FrameworkNotePdf: React.FC<FrameworkNotePdfProps> = ({ isOpen, onClose, projectId }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, projectId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_framework_notes')
        .select('id, version, created_at, status')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
      if (data && data.length > 0) {
        setSelectedNoteId(data[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les notes de cadrage',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // Simuler un export PDF (à remplacer par un vrai export)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Export réussi',
        description: 'La note de cadrage a été exportée en PDF',
      });
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'exporter la note de cadrage',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter en PDF</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune note disponible pour l'export</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-select">Sélectionner une note</Label>
                <Select 
                  value={selectedNoteId} 
                  onValueChange={setSelectedNoteId}
                >
                  <SelectTrigger id="note-select">
                    <SelectValue placeholder="Sélectionner une note" />
                  </SelectTrigger>
                  <SelectContent>
                    {notes.map(note => (
                      <SelectItem key={note.id} value={note.id}>
                        Version {note.version} ({note.status === 'draft' ? 'Brouillon' : 'Publiée'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={handleExportPdf}
            disabled={isExporting || isLoading || notes.length === 0 || !selectedNoteId}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
