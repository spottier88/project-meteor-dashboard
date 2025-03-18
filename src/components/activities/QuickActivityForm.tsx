
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
import { useActivityTypes } from "@/hooks/useActivityTypes";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FormData = {
  activity_type: string;
  description: string;
  duration_minutes: number;
  start_time: string;
  project_id?: string; // Rendu optionnel
};

const QuickActivityForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const session = useSession();
  const form = useForm<FormData>();
  const { data: activityTypes, isLoading: isLoadingTypes } = useActivityTypes(true, true);

  const queryClient = useQueryClient();

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
        project_id: data.project_id || null, // Peut être null maintenant
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

  const noActivityTypesAvailable = !isLoadingTypes && (!activityTypes || activityTypes.length === 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createActivity(data))} className="space-y-4">
        {noActivityTypesAvailable && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Vous n'avez accès à aucun type d'activité. Veuillez contacter un administrateur.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projet (optionnel)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un projet (optionnel)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Aucun projet</SelectItem>
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
                disabled={noActivityTypesAvailable}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingTypes ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                  ) : activityTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.code}>
                      {type.label}
                    </SelectItem>
                  ))}
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

        <Button type="submit" disabled={isLoading || noActivityTypesAvailable}>
          {isLoading ? "Enregistrement..." : "Ajouter l'activité"}
        </Button>
      </form>
    </Form>
  );
};

export default QuickActivityForm;
