
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, 
         DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CalendarDays, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface FrameworkNoteDialogProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
}

export const FrameworkNoteDialog: React.FC<FrameworkNoteDialogProps> = ({ 
  note, 
  isOpen, 
  onClose 
}) => {
  const { toast } = useToast();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'section'>('all');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  if (!note) return null;

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

  // Function to get sections with content
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

  const toggleSectionExpansion = (sectionKey: string) => {
    if (expandedSections.includes(sectionKey)) {
      setExpandedSections(expandedSections.filter(key => key !== sectionKey));
    } else {
      setExpandedSections([...expandedSections, sectionKey]);
    }
  };

  const expandAllSections = () => {
    setExpandedSections(sectionsWithContent.map(section => section.key));
  };

  const collapseAllSections = () => {
    setExpandedSections([]);
  };

  const handleCopySection = (sectionKey: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedSection(sectionKey);
    
    toast({
      title: 'Contenu copié',
      description: 'Le contenu de la section a été copié dans le presse-papier',
    });
    
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const handleSectionSelect = (sectionKey: string) => {
    setSelectedSection(sectionKey);
    setViewMode('section');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Note de cadrage (version {note.version})</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> 
            Créée le {format(new Date(note.created_at), 'dd/MM/yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'section')} className="flex-grow">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Vue complète</TabsTrigger>
            <TabsTrigger value="section">Vue par section</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="flex-grow h-full flex flex-col">
            <div className="flex justify-between mb-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAllSections}>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Tout déplier
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAllSections}>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Tout replier
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {sectionsWithContent.length} sections
              </div>
            </div>
            
            <ScrollArea className="flex-grow overflow-auto">
              <div className="space-y-6 p-4">
                {sectionsWithContent.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cette note ne contient pas encore de contenu.</p>
                  </div>
                )}
                
                {sectionsWithContent.map((section) => (
                  <Collapsible 
                    key={section.key} 
                    open={expandedSections.includes(section.key)}
                    onOpenChange={() => toggleSectionExpansion(section.key)}
                    className="border rounded-lg"
                  >
                    <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => toggleSectionExpansion(section.key)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center">
                          {expandedSections.includes(section.key) ? (
                            <ChevronUp className="h-4 w-4 mr-2" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-2" />
                          )}
                          <h3 className="font-semibold text-lg">{section.label}</h3>
                        </div>
                      </CollapsibleTrigger>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySection(section.key, section.content);
                        }}
                      >
                        {copiedSection === section.key ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0 prose prose-sm max-w-none dark:prose-invert">
                        {section.content.split('\n').map((paragraph: string, i: number) => (
                          <p key={i} className="mb-2">{paragraph}</p>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="section" className="flex-grow h-full flex flex-col">
            <div className="flex mb-4 gap-2">
              <div className="flex-grow">
                <ScrollArea className="whitespace-nowrap pb-2">
                  <div className="flex space-x-2">
                    {sectionsWithContent.map((section) => (
                      <Badge 
                        key={section.key}
                        variant={selectedSection === section.key ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleSectionSelect(section.key)}
                      >
                        {section.label}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => selectedSection && handleCopySection(selectedSection, 
                  sectionsWithContent.find(s => s.key === selectedSection)?.content || '')}
                disabled={!selectedSection}
              >
                {copiedSection === selectedSection ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copier
              </Button>
            </div>
            
            <ScrollArea className="flex-grow overflow-auto">
              <div className="p-4">
                {!selectedSection && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Sélectionnez une section pour afficher son contenu.</p>
                  </div>
                )}
                
                {selectedSection && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{sectionsWithContent.find(s => s.key === selectedSection)?.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {(sectionsWithContent.find(s => s.key === selectedSection)?.content || '').split('\n').map((paragraph: string, i: number) => (
                          <p key={i} className="mb-2">{paragraph}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
