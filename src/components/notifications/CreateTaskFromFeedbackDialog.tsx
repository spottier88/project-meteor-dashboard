/**
 * @component CreateTaskFromFeedbackDialog
 * @description Modale permettant de créer une tâche sur un projet à partir d'un feedback de type évolution.
 * Étape 1 : sélection du projet avec recherche. Étape 2 : formulaire de tâche pré-rempli.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateTaskFromFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Titre pré-rempli (sans le préfixe [Évolution]) */
  defaultTitle: string;
  /** Description pré-remplie */
  defaultDescription: string;
}

export function CreateTaskFromFeedbackDialog({
  open,
  onOpenChange,
  defaultTitle,
  defaultDescription,
}: CreateTaskFromFeedbackDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"select" | "form">("select");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<{ id: string; title: string } | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Récupération de la liste des projets actifs */
  const { data: projects } = useQuery({
    queryKey: ["projects-for-task"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .in("lifecycle_status", ["active", "framing"])
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const filteredProjects = projects?.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  /** Sélection d'un projet → passage au formulaire */
  const handleSelectProject = (project: { id: string; title: string }) => {
    setSelectedProject(project);
    setStep("form");
  };

  /** Création de la tâche */
  const handleCreateTask = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        project_id: selectedProject.id,
        title,
        description,
        status: "todo",
        order_index: 0,
      });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Tâche créée",
        description: `La tâche a été ajoutée au projet "${selectedProject.title}"`,
      });
      handleClose();
    } catch (error) {
      console.error("Erreur création tâche:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Réinitialisation à la fermeture */
  const handleClose = () => {
    setStep("select");
    setSearch("");
    setSelectedProject(null);
    setTitle(defaultTitle);
    setDescription(defaultDescription);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select"
              ? "Sélectionner un projet"
              : `Créer une tâche sur "${selectedProject?.title}"`}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-3">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Liste des projets */}
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun projet trouvé.
                </p>
              ) : (
                filteredProjects.map((p) => (
                  <Button
                    key={p.id}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => handleSelectProject(p)}
                  >
                    {p.title}
                  </Button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre de la tâche</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("select")}>
                Retour
              </Button>
              <Button onClick={handleCreateTask} disabled={isSubmitting || !title.trim()}>
                {isSubmitting ? "Création..." : "Créer la tâche"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
