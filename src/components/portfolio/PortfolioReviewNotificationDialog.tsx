/**
 * @file PortfolioReviewNotificationDialog.tsx
 * @description Dialog pour envoyer des notifications de revue aux chefs de projet
 * avec support des modèles de courriels et prévisualisation
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Users, Loader2, Eye, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSendReviewNotifications, PortfolioReview } from "@/hooks/usePortfolioReviews";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";

interface PortfolioReviewNotificationDialogProps {
  /** État d'ouverture */
  open: boolean;
  /** Callback de fermeture */
  onClose: () => void;
  /** ID du portefeuille */
  portfolioId: string;
  /** Nom du portefeuille */
  portfolioName: string;
  /** Revue concernée */
  review: PortfolioReview | null;
  /** Liste des projets du portefeuille */
  projects: { id: string; title: string; project_manager_id?: string | null }[];
}

interface ProjectManager {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  projectTitles: string[];
}

/**
 * Fusionne les variables dans un template
 */
const mergeTemplate = (
  template: string,
  variables: Record<string, string | string[]>
): string => {
  let result = template;

  // Gestion des listes (project_titles)
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    if (Array.isArray(value)) {
      // Pour les listes, créer des <li> elements
      const listHtml = value.map((item) => `<li>${item}</li>`).join("\n          ");
      result = result.replace(new RegExp(placeholder, "g"), listHtml);
    } else {
      result = result.replace(new RegExp(placeholder, "g"), value);
    }
  });

  // Gestion des conditionnels simples {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (_, variable, content) => {
    const value = variables[variable];
    if (value && (typeof value === "string" ? value.trim() : value.length > 0)) {
      return content;
    }
    return "";
  });

  return result;
};

/**
 * Dialog pour envoyer des notifications de revue aux chefs de projet
 */
export const PortfolioReviewNotificationDialog = ({
  open,
  onClose,
  portfolioId,
  portfolioName,
  review,
  projects,
}: PortfolioReviewNotificationDialogProps) => {
  const [message, setMessage] = useState("");
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const sendNotifications = useSendReviewNotifications(portfolioId);
  const { templates, isLoading: isLoadingTemplates } = useEmailTemplates();

  // Filtrer les templates actifs et pertinents pour les revues
  const availableTemplates = useMemo(() => {
    return (templates || []).filter(
      (t) => t.is_active && (
        t.code.includes("portfolio") || 
        t.code.includes("review") ||
        t.code.includes("notification")
      )
    );
  }, [templates]);

  // Pré-sélectionner le template par défaut
  useEffect(() => {
    if (open && availableTemplates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = availableTemplates.find(
        (t) => t.code === "portfolio_review_notification"
      );
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    }
  }, [open, availableTemplates, selectedTemplateId]);

  // Template sélectionné
  const selectedTemplate = useMemo(() => {
    return availableTemplates.find((t) => t.id === selectedTemplateId) || null;
  }, [availableTemplates, selectedTemplateId]);

  // Récupérer les chefs de projet uniques des projets du portefeuille
  const { data: projectManagers, isLoading } = useQuery({
    queryKey: ["portfolio-project-managers", portfolioId, projects.map((p) => p.id)],
    queryFn: async () => {
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("id, title, project_manager_id, project_manager")
        .in("id", projects.map((p) => p.id));

      if (error) throw error;

      const managerIds = projectsData
        .filter((p) => p.project_manager_id)
        .map((p) => p.project_manager_id as string);

      if (managerIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", [...new Set(managerIds)]);

      if (profilesError) throw profilesError;

      const managerProjectsMap = new Map<string, string[]>();
      projectsData.forEach((project) => {
        if (project.project_manager_id) {
          const existing = managerProjectsMap.get(project.project_manager_id) || [];
          existing.push(project.title);
          managerProjectsMap.set(project.project_manager_id, existing);
        }
      });

      const managers: ProjectManager[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email || "",
        first_name: profile.first_name,
        last_name: profile.last_name,
        projectTitles: managerProjectsMap.get(profile.id) || [],
      }));

      return managers;
    },
    enabled: open && projects.length > 0,
  });

  // Sélectionner tous les chefs de projet par défaut à l'ouverture
  useEffect(() => {
    if (open && projectManagers) {
      setSelectedManagerIds(projectManagers.map((m) => m.id));
    }
  }, [open, projectManagers]);

  // Reset à la fermeture
  useEffect(() => {
    if (!open) {
      setMessage("");
      setShowPreview(false);
    }
  }, [open]);

  // Variables de prévisualisation
  const previewVariables = useMemo(() => {
    const reviewDate = review?.review_date 
      ? format(new Date(review.review_date), "EEEE d MMMM yyyy", { locale: fr })
      : "";
    
    return {
      manager_name: "Jean Dupont",
      portfolio_name: portfolioName,
      review_subject: review?.subject || "",
      review_date: reviewDate,
      project_titles: ["Projet A", "Projet B", "Projet C"],
      message: message || "",
      app_url: window.location.origin,
    };
  }, [portfolioName, review, message]);

  // HTML de prévisualisation
  const previewHtml = useMemo(() => {
    if (!selectedTemplate) return "";
    return mergeTemplate(selectedTemplate.body_html, previewVariables);
  }, [selectedTemplate, previewVariables]);

  const handleToggleManager = (managerId: string) => {
    setSelectedManagerIds((prev) =>
      prev.includes(managerId)
        ? prev.filter((id) => id !== managerId)
        : [...prev, managerId]
    );
  };

  const handleSelectAll = () => {
    if (projectManagers) {
      setSelectedManagerIds(projectManagers.map((m) => m.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedManagerIds([]);
  };

  const handleSend = () => {
    if (selectedManagerIds.length === 0 || !review) return;

    const reviewDate = review.review_date 
      ? format(new Date(review.review_date), "EEEE d MMMM yyyy", { locale: fr })
      : "";

    sendNotifications.mutate(
      {
        reviewId: review.id,
        projectManagerIds: selectedManagerIds,
        message,
        templateId: selectedTemplateId,
        portfolioName,
        reviewSubject: review.subject,
        reviewDate,
      },
      {
        onSuccess: () => {
          onClose();
          setMessage("");
          setSelectedTemplateId(null);
        },
      }
    );
  };

  const formatManagerName = (manager: ProjectManager) => {
    if (manager.first_name || manager.last_name) {
      return `${manager.first_name || ""} ${manager.last_name || ""}`.trim();
    }
    return manager.email;
  };

  return (
    <>
      <Dialog open={open && !showPreview} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Notifier les chefs de projet
            </DialogTitle>
            <DialogDescription>
              Envoyez une notification aux chefs de projet pour les informer de la
              revue à venir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sélecteur de modèle */}
            <div className="space-y-2">
              <Label htmlFor="template" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Modèle de courriel
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selectedTemplateId || ""}
                  onValueChange={(value) => setSelectedTemplateId(value || null)}
                  disabled={isLoadingTemplates}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un modèle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPreview(true)}
                  disabled={!selectedTemplate}
                  title="Prévisualiser"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              )}
            </div>

            {/* Message personnalisé */}
            <div className="space-y-2">
              <Label htmlFor="message">Message personnalisé (optionnel)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Ajoutez un message personnalisé qui sera inclus dans le courriel..."
              />
              <p className="text-xs text-muted-foreground">
                Ce message sera injecté dans la variable {"{{message}}"} du modèle.
              </p>
            </div>

            {/* Liste des chefs de projet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Destinataires ({selectedManagerIds.length}/{projectManagers?.length || 0})
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={isLoading}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={isLoading}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : projectManagers && projectManagers.length > 0 ? (
                <ScrollArea className="h-[180px] rounded-md border p-4">
                  <div className="space-y-3">
                    {projectManagers.map((manager) => (
                      <div
                        key={manager.id}
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => handleToggleManager(manager.id)}
                      >
                        <Checkbox
                          checked={selectedManagerIds.includes(manager.id)}
                          onCheckedChange={() => handleToggleManager(manager.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {formatManagerName(manager)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {manager.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {manager.projectTitles.length} projet
                            {manager.projectTitles.length > 1 ? "s" : ""} :{" "}
                            {manager.projectTitles.slice(0, 2).join(", ")}
                            {manager.projectTitles.length > 2 &&
                              ` +${manager.projectTitles.length - 2}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun chef de projet trouvé pour les projets de ce portefeuille.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                selectedManagerIds.length === 0 ||
                !selectedTemplate ||
                sendNotifications.isPending
              }
              className="gap-2"
            >
              {sendNotifications.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Envoyer ({selectedManagerIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de prévisualisation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Prévisualisation du courriel
            </DialogTitle>
            <DialogDescription>
              Aperçu du courriel avec des données de démonstration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTemplate && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Objet : </span>
                  {mergeTemplate(selectedTemplate.subject, previewVariables)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Variables utilisées : {selectedTemplate.variables.map((v: { name: string }) => v.name).join(", ")}
                </div>
              </div>
            )}

            <ScrollArea className="h-[400px] rounded-md border">
              <iframe
                srcDoc={previewHtml}
                title="Prévisualisation"
                className="w-full h-[600px] border-0"
                sandbox="allow-same-origin"
              />
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Retour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};