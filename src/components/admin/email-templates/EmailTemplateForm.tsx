/**
 * @component EmailTemplateForm
 * @description Formulaire de création/édition d'un modèle d'email.
 * Inclut un éditeur HTML et la gestion des variables de publipostage.
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Copy, Info } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEmailTemplates, EmailTemplate, EmailTemplateInput } from "@/hooks/useEmailTemplates";
import { useToast } from "@/components/ui/use-toast";

// Schéma de validation
const templateSchema = z.object({
  code: z.string().min(1, "Le code est requis").regex(/^[a-z_]+$/, "Uniquement lettres minuscules et underscores"),
  name: z.string().min(1, "Le nom est requis"),
  subject: z.string().min(1, "Le sujet est requis"),
  body_html: z.string().min(1, "Le contenu HTML est requis"),
  body_text: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof templateSchema>;

interface EmailTemplateFormProps {
  template: EmailTemplate | null;
  open: boolean;
  onClose: () => void;
}

// Variables prédéfinies disponibles
const PREDEFINED_VARIABLES = [
  { name: "user_first_name", description: "Prénom de l'utilisateur" },
  { name: "user_last_name", description: "Nom de l'utilisateur" },
  { name: "user_email", description: "Email de l'utilisateur" },
  { name: "date", description: "Date de l'envoi" },
  { name: "app_url", description: "URL de l'application" },
  { name: "has_tasks", description: "Booléen: a des tâches assignées" },
  { name: "tasks_count", description: "Nombre de tâches" },
  { name: "tasks_list", description: "Liste HTML des tâches" },
  { name: "tasks_list_text", description: "Liste texte des tâches" },
  { name: "has_projects", description: "Booléen: a des projets assignés" },
  { name: "projects_count", description: "Nombre de projets" },
  { name: "projects_list", description: "Liste HTML des projets" },
  { name: "projects_list_text", description: "Liste texte des projets" },
  { name: "has_roles", description: "Booléen: a des changements de rôles" },
  { name: "roles_count", description: "Nombre de changements" },
  { name: "roles_list", description: "Liste HTML des rôles" },
  { name: "roles_list_text", description: "Liste texte des rôles" },
];

export const EmailTemplateForm = ({ template, open, onClose }: EmailTemplateFormProps) => {
  const { createTemplate, updateTemplate, isCreating, isUpdating } = useEmailTemplates();
  const { toast } = useToast();
  const [variables, setVariables] = useState<Array<{ name: string; description: string }>>(
    template?.variables || []
  );
  const [newVarName, setNewVarName] = useState("");
  const [newVarDesc, setNewVarDesc] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      code: template?.code || "",
      name: template?.name || "",
      subject: template?.subject || "",
      body_html: template?.body_html || "",
      body_text: template?.body_text || "",
      description: template?.description || "",
      is_active: template?.is_active ?? true,
    },
  });

  // Réinitialiser le formulaire quand le template change
  useEffect(() => {
    if (template) {
      form.reset({
        code: template.code,
        name: template.name,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text || "",
        description: template.description || "",
        is_active: template.is_active,
      });
      setVariables(template.variables || []);
    } else {
      form.reset({
        code: "",
        name: "",
        subject: "",
        body_html: "",
        body_text: "",
        description: "",
        is_active: true,
      });
      setVariables([]);
    }
  }, [template, form]);

  // Ajouter une variable personnalisée
  const handleAddVariable = () => {
    if (newVarName && !variables.find(v => v.name === newVarName)) {
      setVariables([...variables, { name: newVarName, description: newVarDesc }]);
      setNewVarName("");
      setNewVarDesc("");
    }
  };

  // Supprimer une variable
  const handleRemoveVariable = (name: string) => {
    setVariables(variables.filter(v => v.name !== name));
  };

  // Copier une variable dans le presse-papier
  const handleCopyVariable = (name: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    toast({
      title: "Variable copiée",
      description: `{{${name}}} copiée dans le presse-papier`,
    });
  };

  // Insérer une variable dans le champ actif
  const handleInsertVariable = (name: string, fieldName: "subject" | "body_html" | "body_text") => {
    const currentValue = form.getValues(fieldName) || "";
    form.setValue(fieldName, currentValue + `{{${name}}}`);
  };

  // Soumettre le formulaire
  const onSubmit = (values: FormValues) => {
    const input: EmailTemplateInput = {
      code: values.code,
      name: values.name,
      subject: values.subject,
      body_html: values.body_html,
      body_text: values.body_text || null,
      description: values.description || null,
      is_active: values.is_active,
      variables,
    };

    if (template) {
      updateTemplate({ id: template.id, ...input });
    } else {
      createTemplate(input);
    }
    onClose();
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? "Modifier le modèle" : "Nouveau modèle d'email"}
          </DialogTitle>
          <DialogDescription>
            Configurez le modèle d'email avec les variables de publipostage
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">Général</TabsTrigger>
                  <TabsTrigger value="content">Contenu</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                </TabsList>

                {/* Onglet Général */}
                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code unique</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="daily_digest" 
                              {...field} 
                              disabled={!!template}
                            />
                          </FormControl>
                          <FormDescription>
                            Identifiant technique (lettres minuscules et _)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Synthèse quotidienne" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description du modèle..." 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sujet de l'email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="[Meteor] Synthèse du {{date}}" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Utilisez {"{{variable}}"} pour insérer des valeurs dynamiques
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Modèle actif</FormLabel>
                          <FormDescription>
                            Seuls les modèles actifs sont utilisés pour l'envoi
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
                </TabsContent>

                {/* Onglet Contenu */}
                <TabsContent value="content" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="body_html"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenu HTML</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="<html>...</html>" 
                            rows={15}
                            className="font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Code HTML de l'email. Utilisez {"{{#if variable}}...{{/if}}"} pour les conditions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="body_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version texte (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Version texte brut de l'email..." 
                            rows={8}
                            className="font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Alternative texte pour les clients email ne supportant pas le HTML
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Onglet Variables */}
                <TabsContent value="variables" className="space-y-4 mt-4">
                  {/* Variables prédéfinies */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      Variables disponibles
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Cliquez sur une variable pour la copier
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <ScrollArea className="h-32 rounded-md border p-2">
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_VARIABLES.map((v) => (
                          <TooltipProvider key={v.name}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => handleCopyVariable(v.name)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  {`{{${v.name}}}`}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>{v.description}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Variables personnalisées du template */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Variables du modèle</h4>
                    <ScrollArea className="h-40 rounded-md border p-2">
                      <div className="space-y-2">
                        {variables.map((v) => (
                          <div 
                            key={v.name} 
                            className="flex items-center justify-between bg-muted/50 rounded-md p-2"
                          >
                            <div>
                              <code className="text-sm font-medium">{`{{${v.name}}}`}</code>
                              <span className="text-sm text-muted-foreground ml-2">
                                - {v.description}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveVariable(v.name)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Ajouter une variable */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-medium">Ajouter une variable personnalisée</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Nom de la variable"
                        value={newVarName}
                        onChange={(e) => setNewVarName(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                      />
                      <Input
                        placeholder="Description"
                        value={newVarDesc}
                        onChange={(e) => setNewVarDesc(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddVariable}
                      disabled={!newVarName}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : template ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
