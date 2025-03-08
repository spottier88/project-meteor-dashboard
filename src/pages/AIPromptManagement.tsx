
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Edit, Trash2, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { logger } from "@/utils/logger";
import { Badge } from "@/components/ui/badge";

// Types
type PromptTemplate = {
  id: string;
  type: string;
  section: string;
  template: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Validation schema
const promptTemplateSchema = z.object({
  type: z.string().min(1, "Le type est requis"),
  section: z.string().min(1, "La section est requise"),
  template: z.string().min(1, "Le contenu du template est requis"),
  is_active: z.boolean(),
});

type PromptTemplateFormValues = z.infer<typeof promptTemplateSchema>;

export const AIPromptManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PromptTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch prompt templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["promptTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_prompt_templates")
        .select("*")
        .order("type", { ascending: true })
        .order("section", { ascending: true })
        .order("version", { ascending: false });

      if (error) {
        logger.error(`Erreur lors de la récupération des templates: ${error.message}`);
        throw error;
      }

      return data as PromptTemplate[];
    },
  });

  // Initialize form
  const form = useForm<PromptTemplateFormValues>({
    resolver: zodResolver(promptTemplateSchema),
    defaultValues: {
      type: "",
      section: "",
      template: "",
      is_active: true,
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (values: PromptTemplateFormValues) => {
      if (editingTemplate) {
        // Mettre à jour un template existant
        const { error } = await supabase
          .from("ai_prompt_templates")
          .update({
            type: values.type,
            section: values.section,
            template: values.template,
            is_active: values.is_active,
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        
        return { type: "update" };
      } else {
        // Créer un nouveau template
        const { data: latestVersion } = await supabase
          .from("ai_prompt_templates")
          .select("version")
          .eq("type", values.type)
          .eq("section", values.section)
          .order("version", { ascending: false })
          .limit(1)
          .single();

        const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

        const { error } = await supabase
          .from("ai_prompt_templates")
          .insert([
            {
              type: values.type,
              section: values.section,
              template: values.template,
              version: nextVersion,
              is_active: values.is_active,
            },
          ]);

        if (error) throw error;
        
        return { type: "create" };
      }
    },
    onSuccess: (result) => {
      toast({
        title: result.type === "create" ? "Template créé" : "Template mis à jour",
        description: "Le template a été enregistré avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["promptTemplates"] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_prompt_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Template supprimé",
        description: "Le template a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["promptTemplates"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (template: PromptTemplate) => {
      const { data: latestVersion } = await supabase
        .from("ai_prompt_templates")
        .select("version")
        .eq("type", template.type)
        .eq("section", template.section)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

      const { error } = await supabase
        .from("ai_prompt_templates")
        .insert([
          {
            type: template.type,
            section: template.section,
            template: template.template,
            version: nextVersion,
            is_active: false, // La copie est inactive par défaut
          },
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Template dupliqué",
        description: "Une nouvelle version du template a été créée.",
      });
      queryClient.invalidateQueries({ queryKey: ["promptTemplates"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("ai_prompt_templates")
        .update({
          is_active: isActive,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut du template a été mis à jour.",
      });
      queryClient.invalidateQueries({ queryKey: ["promptTemplates"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle opening the dialog
  const handleOpenDialog = (template?: PromptTemplate) => {
    if (template) {
      setEditingTemplate(template);
      form.reset({
        type: template.type,
        section: template.section,
        template: template.template,
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      form.reset({
        type: "",
        section: "",
        template: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  // Show preview dialog
  const handleShowPreview = (template: PromptTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  // Group templates by type and section
  const groupedTemplates = React.useMemo(() => {
    if (!templates) return {};
    
    return templates.reduce((acc: Record<string, Record<string, PromptTemplate[]>>, template) => {
      if (!acc[template.type]) {
        acc[template.type] = {};
      }
      if (!acc[template.type][template.section]) {
        acc[template.type][template.section] = [];
      }
      acc[template.type][template.section].push(template);
      return acc;
    }, {});
  }, [templates]);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin">
              <ChevronLeft className="h-4 w-4" />
              Retour à l'administration
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des templates IA</h1>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      {isLoading ? (
        <div>Chargement des templates...</div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedTemplates).length === 0 ? (
            <div className="text-center p-8 border rounded-md">
              <p className="text-muted-foreground">Aucun template défini. Créez votre premier template pour commencer.</p>
            </div>
          ) : (
            Object.entries(groupedTemplates).map(([type, sections]) => (
              <div key={type} className="space-y-4">
                <h2 className="text-xl font-semibold">{type}</h2>
                {Object.entries(sections).map(([section, templatesList]) => (
                  <div key={`${type}-${section}`} className="border rounded-md p-4 bg-white">
                    <h3 className="text-lg font-medium mb-3">{section}</h3>
                    <div className="divide-y">
                      {templatesList.map((template) => (
                        <div key={template.id} className="py-3 flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Version {template.version}</span>
                              {template.is_active && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Actif
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Dernière mise à jour: {new Date(template.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowPreview(template)}
                            >
                              Aperçu
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateMutation.mutate(template)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActiveMutation.mutate({ id: template.id, isActive: !template.is_active })}
                            >
                              {template.is_active ? "Désactiver" : "Activer"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) {
                                  deleteMutation.mutate(template.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* Dialog pour ajouter/éditer un template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Modifier le template" : "Ajouter un nouveau template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Modifiez les détails du template ci-dessous."
                : "Remplissez le formulaire pour créer un nouveau template."
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: framework_note"
                          {...field}
                          disabled={!!editingTemplate}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: context"
                          {...field}
                          disabled={!!editingTemplate}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenu du template</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Entrez le contenu du template..."
                        className="h-[300px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Actif
                      </FormLabel>
                      <FormDescription>
                        Activer ce template pour qu'il soit utilisé dans l'application
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.status === "loading"}
                >
                  {mutation.status === "loading" ? (
                    "Enregistrement..."
                  ) : (
                    editingTemplate ? "Mettre à jour" : "Créer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog pour prévisualiser un template */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Aperçu du template
            </DialogTitle>
            <DialogDescription>
              {previewTemplate && `Type: ${previewTemplate.type} - Section: ${previewTemplate.section} - Version: ${previewTemplate.version}`}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 p-4 rounded-md h-[400px] overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {previewTemplate?.template}
            </pre>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsPreviewOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
