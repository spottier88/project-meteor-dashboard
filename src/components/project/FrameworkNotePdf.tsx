
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';

interface FrameworkNotePdfProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

// Définir les styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 5,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
  },
});

// Composant PDF pour la note de cadrage
const NotePDF = ({ note, projectTitle }: { note: any, projectTitle: string }) => {
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

  const getSectionsWithContent = () => {
    const sections = [];
    for (const [key, value] of Object.entries(note.content)) {
      if (value && sectionLabels[key]) {
        sections.push({
          key,
          label: sectionLabels[key],
          content: value
        });
      }
    }
    return sections;
  };

  const sectionsWithContent = getSectionsWithContent();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Note de cadrage: {projectTitle}</Text>
        <Text style={styles.subtitle}>Version {note.version} - {new Date(note.created_at).toLocaleDateString()}</Text>
        
        {sectionsWithContent.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.title}>{section.label}</Text>
            <Text style={styles.text}>{section.content}</Text>
          </View>
        ))}
        
        <Text style={styles.footer}>Document généré le {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
};

export const FrameworkNotePdf: React.FC<FrameworkNotePdfProps> = ({ isOpen, onClose, projectId }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
      fetchProjectTitle();
    }
  }, [isOpen, projectId]);

  const fetchProjectTitle = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('title')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProjectTitle(data?.title || 'Projet');
    } catch (error) {
      console.error('Erreur lors du chargement du titre du projet:', error);
    }
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_framework_notes')
        .select('id, version, created_at, status, content')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
      if (data && data.length > 0) {
        setSelectedNoteId(data[0].id);
        setSelectedNote(data[0]);
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

  const handleNoteChange = (noteId: string) => {
    setSelectedNoteId(noteId);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(note);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // Ceci sera remplacé par le vrai téléchargement via PDFDownloadLink
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Exporter en PDF',
        description: 'Utilisez le bouton "Télécharger" qui apparaît',
      });
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
                  onValueChange={handleNoteChange}
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

              {selectedNote && (
                <div className="border rounded-lg p-4 mt-4">
                  <h3 className="font-semibold mb-2">Aperçu</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {Object.entries(selectedNote.content).map(([key, value]) => {
                        if (value && sectionLabels[key]) {
                          return (
                            <div key={key} className="text-sm">
                              <span className="font-medium">{sectionLabels[key]}:</span>
                              <p className="truncate text-muted-foreground">{String(value).substring(0, 100)}...</p>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          
          {selectedNote && (
            <PDFDownloadLink 
              document={<NotePDF note={selectedNote} projectTitle={projectTitle} />} 
              fileName={`Note_Cadrage_${projectTitle.replace(/\s+/g, '_')}_v${selectedNote.version}.pdf`}
              className="inline-block"
            >
              {({ blob, url, loading, error }) => (
                <Button 
                  disabled={loading}
                  onClick={handleExportPdf}
                >
                  {loading || isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Télécharger
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
