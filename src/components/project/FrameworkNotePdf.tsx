
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown, FileText, Download } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { PDFDocument, rgb, StandardFonts } from '@react-pdf/renderer';

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
  const [noteContent, setNoteContent] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (selectedNoteId) {
      fetchNoteContent(selectedNoteId);
    }
  }, [selectedNoteId]);

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

  const fetchNoteContent = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_framework_notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;

      setNoteContent(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger le contenu de la note',
      });
    }
  };

  const handleExportPdf = async () => {
    if (!noteContent) return;
    
    setIsExporting(true);
    try {
      // Création de l'élément pour le rendu HTML
      const contentElement = document.createElement('div');
      contentElement.style.width = '800px';
      contentElement.style.padding = '40px';
      contentElement.style.background = 'white';
      contentElement.style.position = 'absolute';
      contentElement.style.left = '-9999px';
      
      // Entête
      const headerElem = document.createElement('div');
      headerElem.style.marginBottom = '30px';
      headerElem.style.borderBottom = '1px solid #ccc';
      headerElem.style.paddingBottom = '10px';
      
      const titleElem = document.createElement('h1');
      titleElem.textContent = `Note de cadrage - Version ${noteContent.version}`;
      titleElem.style.fontSize = '24px';
      titleElem.style.marginBottom = '10px';
      headerElem.appendChild(titleElem);
      
      const dateElem = document.createElement('p');
      dateElem.textContent = `Créée le ${format(new Date(noteContent.created_at), 'dd/MM/yyyy')}`;
      dateElem.style.fontSize = '14px';
      dateElem.style.color = '#666';
      headerElem.appendChild(dateElem);
      
      contentElement.appendChild(headerElem);
      
      // Contenu de la note
      const sectionLabels: Record<string, string> = {
        objectifs: "Objectifs",
        contexte: "Contexte",
        perimetre: "Périmètre",
        parties_prenantes: "Parties prenantes",
        risques: "Risques",
        budget: "Budget",
        planning: "Planning",
        organisation: "Organisation",
        livrables: "Livrables",
        communication: "Communication",
        decision: "Points de décision"
      };
      
      for (const [key, value] of Object.entries(noteContent.content)) {
        if (value && sectionLabels[key]) {
          const sectionElem = document.createElement('div');
          sectionElem.style.marginBottom = '30px';
          
          const sectionTitle = document.createElement('h2');
          sectionTitle.textContent = sectionLabels[key];
          sectionTitle.style.fontSize = '18px';
          sectionTitle.style.marginBottom = '10px';
          sectionTitle.style.borderBottom = '1px solid #eee';
          sectionTitle.style.paddingBottom = '5px';
          sectionElem.appendChild(sectionTitle);
          
          const contentText = document.createElement('div');
          contentText.style.fontSize = '14px';
          contentText.style.lineHeight = '1.5';
          
          const paragraphs = String(value).split('\n');
          paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
              const p = document.createElement('p');
              p.textContent = paragraph;
              p.style.marginBottom = '10px';
              contentText.appendChild(p);
            }
          });
          
          sectionElem.appendChild(contentText);
          contentElement.appendChild(sectionElem);
        }
      }
      
      document.body.appendChild(contentElement);
      
      try {
        // Capture l'élément en canvas
        const canvas = await html2canvas(contentElement, {
          scale: 1.5, // pour une meilleure qualité
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        // Convertir le canvas en image
        const imgData = canvas.toDataURL('image/png');
        
        // Créer un lien de téléchargement
        const downloadLink = document.createElement('a');
        downloadLink.href = imgData;
        downloadLink.download = `Note_de_cadrage_v${noteContent.version}_${format(new Date(), 'yyyy-MM-dd')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast({
          title: 'Export réussi',
          description: 'La note de cadrage a été exportée avec succès',
        });
      } finally {
        document.body.removeChild(contentElement);
      }
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
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exporter la note de cadrage
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 flex-grow overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune note disponible pour l'export</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="space-y-4 mb-4">
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
              
              {showPreview && noteContent && (
                <ScrollArea className="flex-grow border rounded-md p-4 bg-slate-50">
                  <div className="space-y-6">
                    <div className="pb-4 border-b">
                      <h2 className="text-2xl font-bold">Note de cadrage - Version {noteContent.version}</h2>
                      <p className="text-sm text-muted-foreground">
                        Créée le {format(new Date(noteContent.created_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    
                    {noteContent.content && Object.entries(noteContent.content).map(([key, value]) => {
                      if (!value) return null;
                      
                      const sectionLabels: Record<string, string> = {
                        objectifs: "Objectifs",
                        contexte: "Contexte",
                        perimetre: "Périmètre",
                        parties_prenantes: "Parties prenantes",
                        risques: "Risques",
                        budget: "Budget",
                        planning: "Planning",
                        organisation: "Organisation",
                        livrables: "Livrables",
                        communication: "Communication",
                        decision: "Points de décision"
                      };
                      
                      if (!sectionLabels[key]) return null;
                      
                      return (
                        <div key={key} className="border-b pb-4">
                          <h3 className="text-lg font-semibold mb-2">{sectionLabels[key]}</h3>
                          <div className="whitespace-pre-line text-sm">
                            {String(value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={handleExportPdf}
            disabled={isExporting || isLoading || notes.length === 0 || !selectedNoteId || !noteContent}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
