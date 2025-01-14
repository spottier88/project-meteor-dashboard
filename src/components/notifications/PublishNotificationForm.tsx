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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked && users) {
      setSelectedUserIds(users.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (checked: boolean, userId: string) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

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

      if (data.target_type === "specific" && selectedUserIds.length > 0) {
        const { data: target } = await supabase
          .from("notification_targets")
          .select("id")
          .eq("notification_id", notificationId)
          .single();

        if (target) {
          const userTargets = selectedUserIds.map((userId) => ({
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

  const targetType = form.watch("target_type");

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

        {targetType === "specific" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={users && selectedUserIds.length === users.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Sélectionner tous les utilisateurs
              </label>
            </div>
            
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-2">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(checked as boolean, user.id)}
                    />
                    <label htmlFor={user.id} className="text-sm">
                      {user.first_name} {user.last_name} ({user.email})
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || (targetType === "specific" && selectedUserIds.length === 0)}
          >
            {isSubmitting ? "Publication..." : "Publier"}
          </Button>
        </div>
      </form>
    </Form>
  );
}