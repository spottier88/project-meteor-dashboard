/**
 * @component EmailTemplatePreview
 * @description Prévisualisation d'un modèle d'email avec données fictives.
 */

import { useMemo } from "react";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailTemplate } from "@/hooks/useEmailTemplates";

interface EmailTemplatePreviewProps {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
}

// Données fictives pour la prévisualisation
const MOCK_DATA: Record<string, string | boolean | number> = {
  user_first_name: "Jean",
  user_last_name: "Dupont",
  user_email: "jean.dupont@example.com",
  date: new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  app_url: "https://meteor.app",
  has_tasks: true,
  tasks_count: 3,
  tasks_list: `
    <div class="item">
      <div class="item-title">Rédiger le cahier des charges</div>
      <div class="item-meta">
        <span class="badge badge-task">Projet : Refonte SI</span>
        <span style="margin-left: 10px;">Échéance : 15/01/2025</span>
      </div>
    </div>
    <div class="item">
      <div class="item-title">Valider les maquettes</div>
      <div class="item-meta">
        <span class="badge badge-task">Projet : Application mobile</span>
        <span style="margin-left: 10px;">Échéance : 20/01/2025</span>
      </div>
    </div>
    <div class="item">
      <div class="item-title">Planifier la réunion de lancement</div>
      <div class="item-meta">
        <span class="badge badge-task">Projet : Migration Cloud</span>
        <span style="margin-left: 10px;">Échéance : 10/01/2025</span>
      </div>
    </div>
  `,
  tasks_list_text: `- Rédiger le cahier des charges (Projet: Refonte SI, Échéance: 15/01/2025)
- Valider les maquettes (Projet: Application mobile, Échéance: 20/01/2025)
- Planifier la réunion de lancement (Projet: Migration Cloud, Échéance: 10/01/2025)`,
  has_projects: true,
  projects_count: 2,
  projects_list: `
    <div class="item">
      <div class="item-title">Projet de modernisation RH</div>
      <div class="item-meta">
        <span class="badge badge-project">Rôle : Chef de projet secondaire</span>
      </div>
    </div>
    <div class="item">
      <div class="item-title">Dématérialisation des marchés</div>
      <div class="item-meta">
        <span class="badge badge-project">Rôle : Membre</span>
      </div>
    </div>
  `,
  projects_list_text: `- Projet de modernisation RH (Rôle: Chef de projet secondaire)
- Dématérialisation des marchés (Rôle: Membre)`,
  has_roles: true,
  roles_count: 1,
  roles_list: `
    <div class="item">
      <div class="item-title">Gestionnaire de portefeuille</div>
      <div class="item-meta">
        <span class="badge badge-project">Ajouté</span>
      </div>
    </div>
  `,
  roles_list_text: `- Gestionnaire de portefeuille (Ajouté)`,
};

/**
 * Fusionne le template avec les données de prévisualisation
 */
function mergeTemplate(template: string, variables: Record<string, string | boolean | number>): string {
  let result = template;
  
  // Remplacer les variables simples {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  // Gérer les conditions {{#if variable}}...{{/if}}
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (_, varName, content) => {
    const value = variables[varName];
    return value ? content : '';
  });
  
  return result;
}

export const EmailTemplatePreview = ({ template, open, onClose }: EmailTemplatePreviewProps) => {
  // Générer le contenu prévisualisé
  const previewHtml = useMemo(() => {
    return mergeTemplate(template.body_html, MOCK_DATA);
  }, [template.body_html]);

  const previewText = useMemo(() => {
    return template.body_text ? mergeTemplate(template.body_text, MOCK_DATA) : "";
  }, [template.body_text]);

  const previewSubject = useMemo(() => {
    return mergeTemplate(template.subject, MOCK_DATA);
  }, [template.subject]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Prévisualisation : {template.name}
          </DialogTitle>
          <DialogDescription>
            Aperçu avec des données fictives
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sujet */}
          <div>
            <span className="text-sm font-medium text-muted-foreground">Sujet :</span>
            <div className="mt-1 p-2 bg-muted rounded-md font-medium">
              {previewSubject}
            </div>
          </div>

          {/* Variables utilisées */}
          <div>
            <span className="text-sm font-medium text-muted-foreground">Variables du modèle :</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {template.variables?.map((v) => (
                <Badge key={v.name} variant="outline">
                  {`{{${v.name}}}`}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <Tabs defaultValue="html" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="html">Rendu HTML</TabsTrigger>
            <TabsTrigger value="text">Version texte</TabsTrigger>
            <TabsTrigger value="source">Code source</TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px] border rounded-lg">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[500px]"
                title="Prévisualisation email"
                sandbox=""
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="text" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px] border rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewText || "Pas de version texte définie"}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="source" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px] border rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-xs font-mono">
                {template.body_html}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
