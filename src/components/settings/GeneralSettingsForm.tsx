
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
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
import { supabase } from "@/integrations/supabase/client";

const settingsSchema = z.object({
  client_id: z.string().min(1, "L'ID client est requis"),
  tenant_id: z.string().min(1, "L'ID tenant est requis"),
});

type Settings = z.infer<typeof settingsSchema>;

interface GeneralSettingsFormProps {
  settings?: Array<{
    key: string;
    value: string;
  }>;
  isLoading: boolean;
}

export function GeneralSettingsForm({ settings, isLoading }: GeneralSettingsFormProps) {
  const queryClient = useQueryClient();

  const defaultValues = {
    client_id: settings?.find((s) => s.key === "client_id")?.value || "",
    tenant_id: settings?.find((s) => s.key === "tenant_id")?.value || "",
  };

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const { mutate: saveSettings, isLoading: isSaving } = useMutation({
    mutationFn: async (data: Settings) => {
      // Supprimer les anciens paramètres
      const { error: deleteError } = await supabase
        .from("application_settings")
        .delete()
        .eq("type", "microsoft_graph");

      if (deleteError) throw deleteError;

      // Insérer les nouveaux paramètres
      const { error: insertError } = await supabase.from("application_settings").insert([
        {
          key: "client_id",
          value: data.client_id,
          type: "microsoft_graph",
        },
        {
          key: "tenant_id",
          value: data.tenant_id,
          type: "microsoft_graph",
        },
      ]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Paramètres sauvegardés avec succès");
      queryClient.invalidateQueries({ queryKey: ["application-settings"] });
    },
    onError: (error) => {
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    },
  });

  function onSubmit(data: Settings) {
    saveSettings(data);
  }

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Configuration Microsoft Graph</h2>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Client</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez l'ID client Microsoft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Tenant</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez l'ID tenant Microsoft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </Form>
  );
}
