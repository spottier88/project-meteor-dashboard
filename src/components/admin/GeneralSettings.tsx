
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/hooks/use-toast";
import { PublicClientApplication } from "@azure/msal-browser";

const settingsSchema = z.object({
  clientId: z.string().min(1, "L'ID client est requis"),
  tenantId: z.string().min(1, "L'ID tenant est requis"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const fetchSettings = async () => {
  const { data: settings, error } = await supabase
    .from("application_settings")
    .select("*")
    .eq("type", "microsoft_graph");

  if (error) throw error;

  const formattedSettings = settings.reduce((acc: { [key: string]: string }, setting) => {
    acc[setting.key === "client_id" ? "clientId" : "tenantId"] = setting.value;
    return acc;
  }, {});

  return formattedSettings;
};

export const GeneralSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["msGraphSettings"],
    queryFn: fetchSettings,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      clientId: settings?.clientId || "",
      tenantId: settings?.tenantId || "",
    },
    values: settings,
  });

  const mutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const { error: deleteError } = await supabase
        .from("application_settings")
        .delete()
        .eq("type", "microsoft_graph");

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("application_settings")
        .insert([
          {
            key: "client_id",
            value: values.clientId,
            type: "microsoft_graph",
          },
          {
            key: "tenant_id",
            value: values.tenantId,
            type: "microsoft_graph",
          },
        ]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres Microsoft Graph ont été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["msGraphSettings"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde des paramètres.",
        variant: "destructive",
      });
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
    },
  });

  const testConnection = async () => {
    const formValues = form.getValues();
    
    if (!formValues.clientId || !formValues.tenantId) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord sauvegarder les paramètres de connexion.",
        variant: "destructive",
      });
      return;
    }

    try {
      const msalConfig = {
        auth: {
          clientId: formValues.clientId,
          authority: `https://login.microsoftonline.com/${formValues.tenantId}`,
          redirectUri: window.location.origin,
        },
        cache: {
          cacheLocation: "sessionStorage",
          storeAuthStateInCookie: false,
        },
      };

      const msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();

      const response = await msalInstance.loginPopup({
        scopes: ["Calendars.Read"],
        prompt: "select_account",
      });

      if (response.account) {
        toast({
          title: "Connexion réussie",
          description: "La connexion à Microsoft Graph a été établie avec succès.",
        });
      }
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à Microsoft Graph. Vérifiez vos paramètres.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Chargement des paramètres...</div>;
  }

  return (
     <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to="/admin">
              <ChevronLeft className="h-4 w-4" />
              Retour à l'administration
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres généraux</h1>
        </div>
      </div>
                
    <div className="border rounded-md p-6 bg-white">
      <div>
        <h3 className="text-lg font-medium">Paramètres Microsoft Graph</h3>
        <p className="text-sm text-muted-foreground">
          Configurez les identifiants de connexion pour l'API Microsoft Graph.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="space-y-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Client</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez l'ID client..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tenantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Tenant</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez l'ID tenant..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button 
              type="submit"
              disabled={mutation.status === 'loading'}
            >
              {mutation.status === 'loading' ? "Sauvegarde en cours..." : "Sauvegarder"}
            </Button>

            <Button 
              type="button" 
              variant="secondary"
              onClick={testConnection}
              disabled={mutation.status === 'loading'}
            >
              Tester la connexion
            </Button>
          </div>
        </form>
      </Form>
    </div>
       </div>
  );
};
