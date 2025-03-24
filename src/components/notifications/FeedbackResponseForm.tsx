
/**
 * @component FeedbackResponseForm
 * @description Formulaire de réponse à un feedback utilisateur.
 * Permet aux administrateurs de répondre aux feedbacks soumis par les utilisateurs.
 * Crée une notification ciblée pour l'utilisateur ayant soumis le feedback initial.
 */

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/types/notification";
import { useUser } from "@supabase/auth-helpers-react";

interface FeedbackResponseFormProps {
  feedback: Notification;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FeedbackResponseForm({
  feedback,
  onSuccess,
  onCancel,
}: FeedbackResponseFormProps) {
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!response.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une réponse",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour répondre à un feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Créer une nouvelle notification (réponse)
      const responseTitle = `Réponse à votre demande: ${feedback.title}`;
      const responseContent = `Votre demande: ${feedback.content}\n\nRéponse: ${response}`;

      const { data: notificationData, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          title: responseTitle,
          content: responseContent,
          type: "user", // Utiliser le type "user" pour la réponse
          publication_date: new Date().toISOString(),
          published: true,
          created_by: user.id,
          required: false,
        })
        .select("id")
        .single();

      if (notificationError) throw notificationError;

      // 2. Créer une cible de notification spécifique
      const { data: targetData, error: targetError } = await supabase
        .from("notification_targets")
        .insert({
          notification_id: notificationData.id,
          target_type: "specific",
        })
        .select("id")
        .single();

      if (targetError) throw targetError;

      // 3. Associer cette cible à l'utilisateur qui a créé le feedback
      if (feedback.created_by) {
        const { error: targetUserError } = await supabase
          .from("notification_target_users")
          .insert({
            notification_target_id: targetData.id,
            user_id: feedback.created_by,
          });

        if (targetUserError) throw targetUserError;

        // 4. Créer une entrée dans user_notifications pour que l'utilisateur voit la notification
        const { error: userNotificationError } = await supabase
          .from("user_notifications")
          .insert({
            notification_id: notificationData.id,
            user_id: feedback.created_by,
            read_at: null,
          });

        if (userNotificationError) throw userNotificationError;
      }

      // Rafraîchir les données
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée avec succès",
      });

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse :", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de la réponse",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Feedback original :</h3>
        <div className="bg-muted p-4 rounded-md">
          <p className="font-medium">{feedback.title}</p>
          <p className="whitespace-pre-wrap mt-2">{feedback.content}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="response" className="font-semibold">
          Votre réponse :
        </label>
        <Textarea
          id="response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={6}
          placeholder="Saisissez votre réponse au feedback..."
          className="w-full"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Envoi en cours..." : "Envoyer la réponse"}
        </Button>
      </div>
    </form>
  );
}
