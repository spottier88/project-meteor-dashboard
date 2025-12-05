/**
 * @page EmailTemplateManagement
 * @description Page d'administration des modèles d'email.
 * Permet de créer, modifier, supprimer et prévisualiser les templates.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Plus, ArrowLeft, Eye, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { EmailTemplateForm } from "@/components/admin/email-templates/EmailTemplateForm";
import { EmailTemplatePreview } from "@/components/admin/email-templates/EmailTemplatePreview";

export const EmailTemplateManagement = () => {
  const navigate = useNavigate();
  const { templates, isLoading, deleteTemplate, toggleActive, isDeleting } = useEmailTemplates();
  
  // États pour les dialogs
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Ouvrir le formulaire de création
  const handleCreate = () => {
    setSelectedTemplate(null);
    setShowForm(true);
  };

  // Ouvrir le formulaire d'édition
  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowForm(true);
  };

  // Ouvrir la prévisualisation
  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = (id: string) => {
    setTemplateToDelete(id);
    setShowDeleteDialog(true);
  };

  // Exécuter la suppression
  const handleDelete = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete);
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
    }
  };

  // Toggle activation
  const handleToggleActive = (template: EmailTemplate) => {
    toggleActive({ id: template.id, is_active: !template.is_active });
  };

  // Fermer le formulaire
  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Modèles d'email
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez les modèles d'email avec variables de publipostage
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau modèle
          </Button>
        </div>
      </div>

      {/* Liste des modèles */}
      <Card>
        <CardHeader>
          <CardTitle>Modèles disponibles</CardTitle>
          <CardDescription>
            Les modèles actifs sont utilisés pour l'envoi des emails de notification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {template.code}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {template.variables?.length || 0} variables
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "outline"}>
                        {template.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(template)}
                          title="Prévisualiser"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(template)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(template)}
                          title={template.is_active ? "Désactiver" : "Activer"}
                        >
                          {template.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteConfirm(template.id)}
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun modèle d'email configuré
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog formulaire */}
      {showForm && (
        <EmailTemplateForm
          template={selectedTemplate}
          open={showForm}
          onClose={handleFormClose}
        />
      )}

      {/* Dialog prévisualisation */}
      {showPreview && selectedTemplate && (
        <EmailTemplatePreview
          template={selectedTemplate}
          open={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce modèle d'email ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
