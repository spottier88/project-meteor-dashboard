
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NotificationType } from "@/types/notification";
import { supabase } from "@/integrations/supabase/client";
import { DatePickerField } from "@/components/form/DatePickerField";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthContext } from "@/contexts/AuthContext";

interface NotificationFormData {
  title: string;
  content: string;
  type: NotificationType;
  publication_date: Date;
  required: boolean;
}

interface NotificationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function NotificationForm({ onSuccess, onCancel }: NotificationFormProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<NotificationFormData>({
    defaultValues: {
      title: "",
      content: "",
      type: "system",
      publication_date: new Date(),
      required: false,
    },
  });

  const onSubmit = async (data: NotificationFormData) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une notification",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        title: data.title,
        content: data.content,
        type: data.type,
        publication_date: data.publication_date.toISOString(),
        created_by: user.id,
        published: false,
        required: data.required,
      });

      if (error) throw error;

      // Invalider le cache des notifications
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast({
        title: "Notification créée",
        description: "La notification a été créée avec succès",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la création de la notification:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la notification",
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
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="publication_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de publication</FormLabel>
              <FormControl>
                <DatePickerField
                  label=""
                  value={field.value}
                  onChange={field.onChange}
                  minDate={new Date()}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Notification obligatoire</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Cette notification sera affichée en popup après la connexion jusqu'à ce qu'elle soit lue.
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
