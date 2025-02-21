
import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from '@supabase/auth-helpers-react';

type ActivityFormData = {
  projectId: string;
  activityType: string;
  duration: number;
  description?: string;
  startTime: string;
};

export const QuickActivityForm = () => {
  const { toast } = useToast();
  const user = useUser();
  const queryClient = useQueryClient();

  const form = useForm<ActivityFormData>({
    defaultValues: {
      startTime: new Date().toISOString().slice(0, 16),
    }
  });

  const { data: projects } = useQuery({
    queryKey: ['accessible-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title');
      if (error) throw error;
      return data;
    },
  });

  const createActivity = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      
      const { error } = await supabase
        .from('activities')
        .insert({
          project_id: data.projectId,
          activity_type: data.activityType,
          duration_minutes: data.duration,
          description: data.description,
          start_time: data.startTime,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Activité enregistrée",
        description: "L'activité a été ajoutée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'activité.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ActivityFormData) => {
    createActivity.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projet</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
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
          name="activityType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d'activité</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
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
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durée (minutes)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date et heure</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
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
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Enregistrer
        </Button>
      </form>
    </Form>
  );
};

