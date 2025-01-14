import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Check, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface PublishFormData {
  target_type: "all" | "specific";
  user_ids?: string[];
}

interface PublishNotificationFormProps {
  notificationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PublishNotificationForm({
  notificationId,
  onSuccess,
  onCancel,
}: PublishNotificationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PublishFormData>({
    defaultValues: {
      target_type: "all",
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name");
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: PublishFormData) => {
    setIsSubmitting(true);
    try {
      // Start a transaction
      const { error: targetError } = await supabase
        .from("notification_targets")
        .insert({
          notification_id: notificationId,
          target_type: data.target_type,
        });

      if (targetError) throw targetError;

      if (data.target_type === "specific" && data.user_ids) {
        const { data: target } = await supabase
          .from("notification_targets")
          .select("id")
          .eq("notification_id", notificationId)
          .single();

        if (target) {
          const userTargets = data.user_ids.map((userId) => ({
            notification_target_id: target.id,
            user_id: userId,
          }));

          const { error: userTargetError } = await supabase
            .from("notification_target_users")
            .insert(userTargets);

          if (userTargetError) throw userTargetError;
        }
      }

      // Update notification status
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ published: true })
        .eq("id", notificationId);

      if (updateError) throw updateError;

      toast({
        title: "Notification publiée",
        description: "La notification a été publiée avec succès",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la publication",
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
          name="target_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de cible</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de cible" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Tous les utilisateurs
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      Utilisateurs spécifiques
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Publication..." : "Publier"}
          </Button>
        </div>
      </form>
    </Form>
  );
}