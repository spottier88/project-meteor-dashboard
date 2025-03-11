
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, List, Grid, LinkIcon, FolderPlus } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StandaloneFrameworkNoteGenerator } from "@/components/project/StandaloneFrameworkNoteGenerator";
import { StandaloneFrameworkNotesList } from "@/components/project/StandaloneFrameworkNotesList";
import { StandaloneFrameworkNoteEdit } from "@/components/project/StandaloneFrameworkNoteEdit";
import { StandaloneFrameworkNoteDialog } from "@/components/project/StandaloneFrameworkNoteDialog";
import { StandaloneFrameworkNoteLinkDialog } from "@/components/project/StandaloneFrameworkNoteLinkDialog";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const FrameworkNotesManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, isManager, hasRole } = usePermissionsContext();
  const canEdit = isAdmin || isManager || hasRole('chef_projet');
  
  const [activeTab, setActiveTab] = useState("list");
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const handleViewNote = (note: any) => {
    setSelectedNote(note);
    setIsViewDialogOpen(true);
  };

  const handleEditNote = (note: any) => {
    setSelectedNote(note);
    setIsEditDialogOpen(true);
  };

  const handleLinkNote = (note: any) => {
    setSelectedNote(note);
    setIsLinkDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <DashboardHeader />
      
      <div className="mt-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestion des notes de cadrage</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                Notes existantes
              </TabsTrigger>
              {canEdit && (
                <TabsTrigger value="create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer une note
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notes de cadrage disponibles</CardTitle>
                <CardDescription>
                  Consultez, modifiez ou attachez des notes de cadrage à des projets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandaloneFrameworkNotesList 
                  onViewNote={handleViewNote}
                  onEditNote={handleEditNote}
                  onLinkNote={handleLinkNote}
                  canEdit={canEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {canEdit && (
            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Générer une nouvelle note de cadrage</CardTitle>
                  <CardDescription>
                    Utilisez l'assistant de génération pour créer une note de cadrage complète
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StandaloneFrameworkNoteGenerator 
                    onNoteCreated={() => setActiveTab("list")}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      <StandaloneFrameworkNoteDialog
        note={selectedNote}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
      />
      
      {canEdit && (
        <>
          <StandaloneFrameworkNoteEdit
            note={selectedNote}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedNote(null);
            }}
          />
          
          <StandaloneFrameworkNoteLinkDialog
            note={selectedNote}
            isOpen={isLinkDialogOpen}
            onClose={() => {
              setIsLinkDialogOpen(false);
              setSelectedNote(null);
            }}
          />
        </>
      )}
    </div>
  );
};
