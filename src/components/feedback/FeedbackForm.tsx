
import { useState } from "react";
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

interface FeedbackFormData {
  type: "bug" | "evolution";
  title: string;
  description: string;
}

interface FeedbackFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function FeedbackForm({ onSuccess, onCancel }: FeedbackFormProps) {
  const { toast } = useToast();
  const user = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormData>({
    defaultValues: {
      type: "evolution",
      title: "",
      description: "",
    },
  });

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
      // Création de la notification
      const { data: notification, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          title: `[${data.type === "bug" ? "Bug" : "Évolution"}] ${data.title}`,
          content: data.description,
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
        title: "Retour envoyé",
        description: "Votre retour a été transmis aux administrateurs",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la soumission du retour:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du retour",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="evolution">Évolution</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
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
