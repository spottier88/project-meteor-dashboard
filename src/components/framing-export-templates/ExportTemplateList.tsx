/**
 * @component ExportTemplateList
 * @description Liste des modèles d'export de note de cadrage avec actions CRUD.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Star, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useFramingExportTemplates,
  useUpdateFramingExportTemplate,
  useDeleteFramingExportTemplate,
  FramingExportTemplate,
} from "@/hooks/useFramingExportTemplates";
import { ExportTemplateDialog } from "./ExportTemplateDialog";

export const ExportTemplateList = () => {
  const { data: templates = [], isLoading } = useFramingExportTemplates();
  const updateMutation = useUpdateFramingExportTemplate();
  const deleteMutation = useDeleteFramingExportTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FramingExportTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FramingExportTemplate | null>(null);

  const handleEdit = (template: FramingExportTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleToggleActive = (template: FramingExportTemplate) => {
    updateMutation.mutate({
      id: template.id,
      is_active: !template.is_active,
    });
  };

  const handleSetDefault = (template: FramingExportTemplate) => {
    updateMutation.mutate({
      id: template.id,
      is_default: true,
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({
      id: deleteTarget.id,
      filePath: deleteTarget.file_path,
    });
    setDeleteTarget(null);
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-8">Chargement...</p>;
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Modèles d'export</h3>
            <Button onClick={handleCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un modèle
            </Button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun modèle d'export configuré.</p>
              <p className="text-sm">Ajoutez un modèle DOCX contenant des balises de publipostage.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Par défaut</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{t.title}</span>
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.file_name}</TableCell>
                    <TableCell>
                      {t.is_default ? (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" /> Défaut
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(t)}
                          className="text-xs"
                        >
                          Définir
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.is_active}
                        onCheckedChange={() => handleToggleActive(t)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(t.created_at), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(t)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ExportTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le modèle</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le modèle « {deleteTarget?.title} » ?
              Le fichier associé sera également supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
