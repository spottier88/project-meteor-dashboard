
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface FrameworkNotePdfProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

// Définir les styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  subheader: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 10,
  },
  content: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  footer: {
    fontSize: 10,
    marginTop: 20,
    textAlign: "center",
    color: "#777777",
  },
});

// Définir l'ordre des sections
const sectionOrder = [
  "general",
  "contexte",
  "objectifs", 
  "enjeux",
  "cibles", 
  "resultats_attendus", 
  "risques"
];

// Composant PDF
const FrameworkNotePdfDocument = ({ notes, projectTitle }: { notes: any[], projectTitle: string }) => {
  // Regrouper les notes par section
  const groupedNotes: Record<string, any[]> = {};
  
  notes.forEach(note => {
    const section = note.content?.prompt_section || "general";
    if (!groupedNotes[section]) {
      groupedNotes[section] = [];
    }
    groupedNotes[section].push(note);
  });

  // Obtenez la dernière version de chaque section
  const latestNotes: Record<string, any> = {};
  
  Object.keys(groupedNotes).forEach(section => {
    // Trier par version dans l'ordre décroissant
    const sortedNotes = [...groupedNotes[section]].sort((a, b) => b.version - a.version);
    latestNotes[section] = sortedNotes[0];
  });

  // Obtenir la date de génération
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Traduire les sections pour l'affichage
  const sectionTranslations: Record<string, string> = {
    general: "Général",
    objectifs: "Objectifs",
    contexte: "Contexte",
    cibles: "Cibles",
    resultats_attendus: "Résultats attendus",
    risques: "Risques",
    enjeux: "Enjeux",
  };

  // Ordonner les sections selon l'ordre défini
  const orderedSections = Object.keys(latestNotes)
    .sort((a, b) => {
      const indexA = sectionOrder.indexOf(a);
      const indexB = sectionOrder.indexOf(b);
      // Si une section n'est pas dans la liste, la mettre à la fin
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

  return (
    <Document>
      <Page style={styles.page} size="A4">
        <Text style={styles.header}>Note de cadrage: {projectTitle}</Text>
        <Text style={styles.content}>Date: {formatDate(new Date())}</Text>
        
        {orderedSections.map((section) => (
          <View key={section} style={styles.section}>
            <Text style={styles.subheader}>{sectionTranslations[section] || section}</Text>
            <Text style={styles.content}>{latestNotes[section].content.content}</Text>
          </View>
        ))}
        
        <Text style={styles.footer}>Document généré automatiquement</Text>
      </Page>
    </Document>
  );
};

export const FrameworkNotePdf = ({ isOpen, onClose, projectId }: FrameworkNotePdfProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Récupérer les notes de cadrage
  const { data: notes, isLoading: notesLoading, error, refetch } = useQuery({
    queryKey: ["frameworkNotesForPdf", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_framework_notes")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!projectId,
  });

  // Récupérer les détails du projet
  const { data: project } = useQuery({
    queryKey: ["projectForPdf", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!projectId,
  });

  // Recharger les données lorsque la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  if (!isOpen) return null;

  const isReady = !notesLoading && notes && project;
  const projectTitle = project?.title || "Projet";
  const fileName = `Note_de_Cadrage_${projectTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Exporter la note de cadrage complète
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {notesLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-destructive text-center py-4">
              Erreur lors du chargement des notes de cadrage
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4">
              Aucune note de cadrage disponible pour ce projet
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-4">
                Le PDF contiendra la dernière version de chaque section de note de cadrage.
              </p>
              
              {isReady && (
                <PDFDownloadLink
                  document={<FrameworkNotePdfDocument notes={notes} projectTitle={projectTitle} />}
                  fileName={fileName}
                  className="inline-block"
                >
                  {({ loading, error }) => (
                    <Button 
                      size="lg" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Préparation du PDF...
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          Télécharger le PDF
                        </>
                      )}
                    </Button>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
