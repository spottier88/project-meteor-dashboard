
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Edit, Trash2, Copy, Check, AlertTriangle, Loader2 } from "lucide-react";
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
  FormDescription,
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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

/**
 * Sections prédéfinies pour les notes de cadrage
 * 
 * IMPORTANT : Ces sections doivent correspondre EXACTEMENT aux valeurs de AITemplateSectionKey
 * définies dans src/utils/framingAIHelpers.ts
 * 
 * Mapping avec la base de données project_framing :
 * - contexte           → colonne 'context'
 * - parties_prenantes  → colonne 'stakeholders'
 * - organisation       → colonne 'governance' (note: le nom 'organisation' est utilisé pour les templates IA)
 * - objectifs          → colonne 'objectives'
 * - planning           → colonne 'timeline'
 * - livrables          → colonne 'deliverables'
 * 
 * La section "general" est optionnelle et ne correspond à aucune colonne spécifique
 */
const FRAMEWORK_NOTE_SECTIONS = [
  { value: "general", label: "Général (optionnel)" },
  { value: "contexte", label: "Contexte" },
  { value: "parties_prenantes", label: "Parties prenantes" },
  { value: "organisation", label: "Gouvernance" },
  { value: "objectifs", label: "Objectifs" },
  { value: "planning", label: "Planning prévisionnel" },
  { value: "livrables", label: "Livrables attendus" }
];

// Templates par défaut pour chaque section
const DEFAULT_TEMPLATES = {
  framework_note: {
    general: `Vous êtes un assistant spécialisé dans la rédaction de notes de cadrage de projets. Votre mission est de générer une note de cadrage complète et professionnelle en vous basant sur les informations fournies par l'utilisateur.
    
Veuillez produire une note de cadrage concise, structurée et professionnelle. Utilisez un ton formel et soyez précis dans votre formulation.`,
    
    contexte: `Vous êtes un assistant spécialisé dans l'analyse contextuelle de projets.
En vous basant sur les informations fournies, rédigez une section "Contexte" claire et précise pour une note de cadrage de projet.

Le contexte doit couvrir:
- L'environnement dans lequel s'inscrit le projet
- Les éléments historiques pertinents
- Les contraintes externes connues
- Les motivations principales du projet`,
    
    parties_prenantes: `Vous êtes un assistant spécialisé dans l'identification des parties prenantes de projets.
En vous basant sur les informations fournies, rédigez une section "Parties prenantes" claire et détaillée pour une note de cadrage de projet.

Identifiez et décrivez:
- Les parties prenantes internes et externes
- Leur rôle et niveau d'implication dans le projet
- Leurs attentes et besoins spécifiques
- Les modes de communication privilégiés`,
    
    organisation: `Vous êtes un assistant spécialisé dans la structuration organisationnelle de projets.
En vous basant sur les informations fournies, rédigez une section "Gouvernance" claire et précise pour une note de cadrage de projet.

La gouvernance doit préciser:
- L'organisation du projet (comités, instances de pilotage)
- Les rôles et responsabilités des acteurs clés
- Les processus de décision et d'escalade
- La fréquence et le format des points de suivi`,
    
    objectifs: `Vous êtes un assistant spécialisé dans la définition d'objectifs pour des projets. 
En vous basant sur les informations fournies, rédigez une section "Objectifs" claire et concise pour une note de cadrage de projet.

Les objectifs doivent être SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis).
Incluez des objectifs principaux et secondaires si pertinent.`,
    
    planning: `Vous êtes un assistant spécialisé dans la planification de projets.
En vous basant sur les informations fournies, rédigez une section "Planning prévisionnel" claire et structurée pour une note de cadrage de projet.

Le planning doit inclure:
- Les grandes phases du projet
- Les jalons et échéances clés
- Les dépendances entre les phases
- Les marges de manœuvre et points de contrôle`,
    
    livrables: `Vous êtes un assistant spécialisé dans la définition des livrables de projets.
En vous basant sur les informations fournies, rédigez une section "Livrables attendus" claire et détaillée pour une note de cadrage de projet.

Précisez pour chaque livrable:
- La description et le contenu du livrable
- Les critères de qualité et d'acceptation
- Les dates de livraison prévues
- Les responsables de production et validation`
  }
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
  const [selectedType, setSelectedType] = useState<string>("");
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [isCreateDefaultsDialogOpen, setIsCreateDefaultsDialogOpen] = useState(false);

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

  // Watch the "type" field to determine if we should show predefined sections
  const watchType = form.watch("type");
  
  // Détection des sections manquantes pour les notes de cadrage
  useEffect(() => {
    if (templates) {
      const frameworkTemplates = templates.filter(t => t.type === "framework_note" && t.is_active);
      const existingSections = new Set(frameworkTemplates.map(t => t.section));
      
      const missing = FRAMEWORK_NOTE_SECTIONS
        .filter(section => !existingSections.has(section.value))
        .map(section => section.value);
      
      setMissingSections(missing);
    }
  }, [templates]);

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
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Création des templates par défaut
  const createDefaultTemplatesMutation = useMutation({
    mutationFn: async () => {
      // Pour chaque section manquante, créer un template par défaut
      const templatesPromises = missingSections.map(async (section) => {
        // Vérifier si un template par défaut existe pour cette section
        if (DEFAULT_TEMPLATES.framework_note[section as keyof typeof DEFAULT_TEMPLATES.framework_note]) {
          const defaultTemplate = DEFAULT_TEMPLATES.framework_note[section as keyof typeof DEFAULT_TEMPLATES.framework_note];
          
          // Insérer le template par défaut
          return supabase
            .from("ai_prompt_templates")
            .insert([
              {
                type: "framework_note",
                section: section,
                template: defaultTemplate,
                version: 1,
                is_active: true,
              },
            ]);
        }
        return null;
      });
      
      const results = await Promise.all(templatesPromises);
      
      // Vérifier s'il y a des erreurs
      const errors = results.filter(r => r && r.error).map(r => r?.error);
      if (errors.length > 0) {
        throw new Error(`Erreurs lors de la création des templates par défaut: ${errors.join(', ')}`);
      }
      
      return { count: results.filter(r => r !== null).length };
    },
    onSuccess: (result) => {
      toast({
        title: "Templates par défaut créés",
        description: `${result.count} templates ont été créés avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ["promptTemplates"] });
      setIsCreateDefaultsDialogOpen(false);
    },
    onError: (error: Error) => {
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
    onError: (error: Error) => {
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
    onError: (error: Error) => {
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
    onError: (error: Error) => {
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
      setSelectedType(template.type);
      form.reset({
        type: template.type,
        section: template.section,
        template: template.template,
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setSelectedType("");
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

  // Handle type change
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    form.setValue("type", value);
    
    // Reset section si le type a changé
    if (value !== watchType) {
      form.setValue("section", "");
    }
  };

  // Fonction pour créer un template à partir du modèle par défaut
  const createTemplateFromDefault = (section: string) => {
    if (DEFAULT_TEMPLATES.framework_note[section as keyof typeof DEFAULT_TEMPLATES.framework_note]) {
      form.reset({
        type: "framework_note",
        section: section,
        template: DEFAULT_TEMPLATES.framework_note[section as keyof typeof DEFAULT_TEMPLATES.framework_note],
        is_active: true,
      });
      setSelectedType("framework_note");
      setIsDialogOpen(true);
    }
  };

  // Fonction pour vérifier si une section est manquante
  const isSectionMissing = (section: string): boolean => {
    return missingSections.includes(section);
  };

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
        <div className="flex gap-2">
          {missingSections.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDefaultsDialogOpen(true)}
              className="mr-2"
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Créer {missingSections.length} template(s) manquant(s)
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau template
          </Button>
        </div>
      </div>

      {missingSections.length > 0 && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div className="font-semibold">
              ⚠️ Attention : {missingSections.length} section(s) de note de cadrage sans template actif
            </div>
            <div className="space-y-1">
              <p className="text-sm">Sections manquantes :</p>
              <ul className="text-sm list-disc pl-5 space-y-0.5">
                {missingSections.map(s => {
                  const section = FRAMEWORK_NOTE_SECTIONS.find(fs => fs.value === s);
                  return (
                    <li key={s}>
                      <span className="font-medium">{section ? section.label : s}</span>
                      <span className="text-amber-700"> (section: "{s}")</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="text-sm pt-2 border-t border-amber-300">
              <strong>Impact :</strong> Les templates de secours seront temporairement utilisés pour ces sections.
              <br />
              <strong>Action recommandée :</strong> Créez les templates manquants en cliquant sur le bouton ci-dessus
              pour garantir une cohérence optimale avec votre contexte métier.
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {type}
                  {type === "framework_note" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Note de cadrage
                    </Badge>
                  )}
                </h2>
                {Object.entries(sections).map(([section, templatesList]) => (
                  <div key={`${type}-${section}`} className="border rounded-md p-4 bg-white">
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      {section}
                      {type === "framework_note" && FRAMEWORK_NOTE_SECTIONS.find(s => s.value === section) && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {FRAMEWORK_NOTE_SECTIONS.find(s => s.value === section)?.label}
                        </Badge>
                      )}
                      {type === "framework_note" && !templatesList.some(t => t.is_active) && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Aucun template actif
                        </Badge>
                      )}
                    </h3>
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
                        <Select
                          value={field.value}
                          onValueChange={handleTypeChange}
                          disabled={!!editingTemplate}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="framework_note">Note de cadrage</SelectItem>
                            <SelectItem value="general">Général</SelectItem>
                            <SelectItem value="custom">Personnalisé</SelectItem>
                          </SelectContent>
                        </Select>
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
                        {selectedType === "framework_note" ? (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!!editingTemplate}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une section" />
                            </SelectTrigger>
                            <SelectContent>
                              {FRAMEWORK_NOTE_SECTIONS.map((section) => (
                                <SelectItem key={section.value} value={section.value}>
                                  {section.label} {isSectionMissing(section.value) && "⚠️"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Ex: context"
                            {...field}
                            disabled={!!editingTemplate}
                          />
                        )}
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

      {/* Dialog pour créer les templates par défaut */}
      <Dialog open={isCreateDefaultsDialogOpen} onOpenChange={setIsCreateDefaultsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer les templates manquants</DialogTitle>
            <DialogDescription>
              Cette action va créer {missingSections.length} template(s) par défaut pour les sections manquantes de note de cadrage.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <p className="text-sm">Sections manquantes :</p>
            <ul className="text-sm list-disc pl-6 space-y-1">
              {missingSections.map(section => {
                const sectionLabel = FRAMEWORK_NOTE_SECTIONS.find(s => s.value === section)?.label || section;
                return (
                  <li key={section}>{sectionLabel}</li>
                );
              })}
            </ul>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDefaultsDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => createDefaultTemplatesMutation.mutate()}
              disabled={createDefaultTemplatesMutation.isLoading}
            >
              {createDefaultTemplatesMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Créer les templates
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
