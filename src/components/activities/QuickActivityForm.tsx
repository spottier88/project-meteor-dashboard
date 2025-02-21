
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useSession } from "@supabase/auth-helpers-react";
import { Database } from "@/integrations/supabase/types";

type ActivityType = Database["public"]["Enums"]["activity_type"];

type FormData = {
  activity_type: ActivityType;
  description: string;
  duration_minutes: number;
  start_time: string;
  project_id: string;
};

export function QuickActivityForm({ onSuccess }: { onSuccess?: () => void }) {
  const session = useSession();
  const form = useForm<FormData>();

  const queryClient = useQueryClient();

  // Fetch accessible projects
  const { data: projects } = useQuery({
    queryKey: ["accessible-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const { mutate: createActivity, isLoading } = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from("activities").insert({
        activity_type: data.activity_type,
        description: data.description,
        duration_minutes: data.duration_minutes,
        start_time: data.start_time,
        project_id: data.project_id,
        user_id: session?.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Activité ajoutée avec succès" });
      onSuccess?.();
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Erreur",
        description: "Impossible d'ajouter l'activité",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createActivity(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="project_id"
          rules={{ required: "Veuillez sélectionner un projet" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projet</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un projet" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activity_type"
          rules={{ required: "Veuillez sélectionner un type d'activité" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d'activité</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="development">Développement</SelectItem>
                  <SelectItem value="testing">Tests</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          rules={{ required: "Veuillez saisir une description" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration_minutes"
          rules={{ required: "Veuillez saisir une durée" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durée (minutes)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="1" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_time"
          rules={{ required: "Veuillez saisir une date et heure" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date et heure</FormLabel>
              <FormControl>
                <Input {...field} type="datetime-local" />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Enregistrement..." : "Ajouter l'activité"}
        </Button>
      </form>
    </Form>
  );
}

