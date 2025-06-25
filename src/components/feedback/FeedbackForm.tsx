
import { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@/types/user";
import { ProjectSelectionTable } from "@/components/ProjectSelectionTable";

interface FeedbackFormData {
  type: "bug" | "evolution" | "role_change" | "project_deletion";
  title: string;
  description: string;
  role?: UserRole;
  projectIds?: string[];
}

interface FeedbackFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function FeedbackForm({ onSuccess, onCancel }: FeedbackFormProps) {
  const { toast } = useToast();
  const user = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const form = useForm<FeedbackFormData>({
    defaultValues: {
      type: "evolution",
      title: "",
      description: "",
    },
  });

  const selectedType = form.watch("type");

  // Récupérer les rôles disponibles
  const { data: availableRoles } = useQuery({
    queryKey: ["availableRoles"],
    queryFn: async () => {
      return ["chef_projet", "manager", "membre", "time_tracker"] as UserRole[];
    },
  });

  // Récupérer les projets gérés par l'utilisateur (pour la suppression)
  const { data: managedProjects } = useQuery({
    queryKey: ["managedProjects", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data } = await supabase
        .rpc('get_team_view_projects', { p_user_id: user.id });
      
      return data || [];
    },
    enabled: !!user && selectedType === "project_deletion",
  });

  const getTitlePlaceholder = () => {
    switch (selectedType) {
      case "bug":
        return "Titre du bug";
      case "evolution":
        return "Titre de la demande d'évolution";
      case "role_change":
        return "Demande de modification de droits";
      case "project_deletion":
        return "Demande de suppression de projet";
      default:
        return "Titre";
    }
  };

  const getDescriptionPlaceholder = () => {
    switch (selectedType) {
      case "bug":
        return "Décrivez le bug rencontré et comment le reproduire";
      case "evolution":
        return "Décrivez l'évolution souhaitée";
      case "role_change":
        return "Précisez pourquoi vous souhaitez ce changement de rôle";
      case "project_deletion":
        return "Indiquez les raisons de la suppression du/des projet(s)";
      default:
        return "Description";
    }
  };

  const resetSpecificFields = () => {
    if (selectedType !== "role_change") {
      form.setValue("role", undefined);
    }
    if (selectedType !== "project_deletion") {
      setSelectedProjectIds([]);
    }
  };

  useEffect(() => {
    resetSpecificFields();
  }, [selectedType]);

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour soumettre un retour",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let title = data.title;
      let content = data.description;

      // Adaptation du titre et du contenu selon le type
      switch (data.type) {
        case "bug":
          title = `[Bug] ${data.title}`;
          break;
        case "evolution":
          title = `[Évolution] ${data.title}`;
          break;
        case "role_change":
          title = `[Demande de rôle] ${data.title}`;
          content = `Rôle demandé: ${data.role}\n\n${data.description}`;
          break;
        case "project_deletion":
          title = `[Suppression de projet] ${data.title}`;
          if (selectedProjectIds.length > 0) {
            const projectTitles = managedProjects
              ?.filter(p => selectedProjectIds.includes(p.id))
              .map(p => p.title)
              .join(", ");
            content = `Projets à supprimer: ${projectTitles}\n\n${data.description}`;
          }
          break;
      }

      // Création de la notification
      const { data: notification, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          title: title,
          content: content,
          type: "feedback",
          publication_date: new Date().toISOString(),
          created_by: user.id,
          published: true,
        })
        .select()
        .single();

      if (notificationError) throw notificationError;

      // Création de la cible de notification (administrateurs)
      const { data: target, error: targetError } = await supabase
        .from("notification_targets")
        .insert({
          notification_id: notification.id,
          target_type: "specific",
        })
        .select()
        .single();

      if (targetError) throw targetError;

      // Récupération des administrateurs
      const { data: admins, error: adminsError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminsError) throw adminsError;

      // Création des liens notification-utilisateur pour chaque admin
      const adminNotifications = admins.map((admin) => ({
        notification_id: notification.id,
        user_id: admin.user_id,
      }));

      const { error: userNotificationsError } = await supabase
        .from("user_notifications")
        .insert(adminNotifications);

      if (userNotificationsError) throw userNotificationsError;

      // Création des liens target-utilisateur pour chaque admin
      const targetUsers = admins.map((admin) => ({
        notification_target_id: target.id,
        user_id: admin.user_id,
      }));

      const { error: targetUsersError } = await supabase
        .from("notification_target_users")
        .insert(targetUsers);

      if (targetUsersError) throw targetUsersError;

      toast({
        title: "Demande envoyée",
        description: "Votre demande a été transmise aux administrateurs",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la soumission du retour:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de la demande",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSelectionChange = (projectIds: string[]) => {
    setSelectedProjectIds(projectIds);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de demande</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="evolution">Évolution</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="role_change">Modification de droits</SelectItem>
                  <SelectItem value="project_deletion">Suppression d'un projet</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input {...field} placeholder={getTitlePlaceholder()} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === "role_change" && availableRoles && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle souhaité</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le rôle souhaité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role === "chef_projet" ? "Chef de projet" :
                          role === "manager" ? "Manager" :
                          role === "membre" ? "Membre" :
                          role === "time_tracker" ? "Suivi des activités" : role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === "project_deletion" && (
          <div className="space-y-2">
            <FormLabel>Projets à supprimer</FormLabel>
            <ProjectSelectionTable onSelectionChange={handleProjectSelectionChange} />
          </div>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder={getDescriptionPlaceholder()}
                  className="min-h-[120px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
