/**
 * @file PortfolioReviewNotificationDialog.tsx
 * @description Dialog pour envoyer des notifications de revue aux chefs de projet
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Users, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useSendReviewNotifications } from "@/hooks/usePortfolioReviews";

interface PortfolioReviewNotificationDialogProps {
  /** État d'ouverture */
  open: boolean;
  /** Callback de fermeture */
  onClose: () => void;
  /** ID du portefeuille */
  portfolioId: string;
  /** ID de la revue */
  reviewId: string;
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
 * Dialog pour envoyer des notifications de revue aux chefs de projet
 */
export const PortfolioReviewNotificationDialog = ({
  open,
  onClose,
  portfolioId,
  reviewId,
  projects,
}: PortfolioReviewNotificationDialogProps) => {
  const [message, setMessage] = useState(
    "Une revue de projets est programmée. Merci de mettre à jour l'état d'avancement de vos projets."
  );
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const sendNotifications = useSendReviewNotifications(portfolioId);

  // Récupérer les chefs de projet uniques des projets du portefeuille
  const { data: projectManagers, isLoading } = useQuery({
    queryKey: ["portfolio-project-managers", portfolioId, projects.map((p) => p.id)],
    queryFn: async () => {
      // Récupérer les projets avec leur chef de projet
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("id, title, project_manager_id, project_manager")
        .in(
          "id",
          projects.map((p) => p.id)
        );

      if (error) throw error;

      // Récupérer les IDs des chefs de projet
      const managerIds = projectsData
        .filter((p) => p.project_manager_id)
        .map((p) => p.project_manager_id as string);

      if (managerIds.length === 0) return [];

      // Récupérer les profils des chefs de projet
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", [...new Set(managerIds)]);

      if (profilesError) throw profilesError;

      // Créer un mapping chef de projet -> projets
      const managerProjectsMap = new Map<string, string[]>();
      projectsData.forEach((project) => {
        if (project.project_manager_id) {
          const existing = managerProjectsMap.get(project.project_manager_id) || [];
          existing.push(project.title);
          managerProjectsMap.set(project.project_manager_id, existing);
        }
      });

      // Créer la liste finale des chefs de projet
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
    if (selectedManagerIds.length === 0 || !reviewId) return;

    sendNotifications.mutate(
      {
        reviewId,
        projectManagerIds: selectedManagerIds,
        message,
      },
      {
        onSuccess: () => {
          onClose();
          setMessage(
            "Une revue de projets est programmée. Merci de mettre à jour l'état d'avancement de vos projets."
          );
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Message à envoyer aux chefs de projet..."
            />
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
              <ScrollArea className="h-[200px] rounded-md border p-4">
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
              !message.trim() ||
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
  );
};
