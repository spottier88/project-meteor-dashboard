
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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

// Définir le type pour correspondre exactement à l'enum setting_type de la base de données
type ApplicationSettingType = "microsoft_graph" | "openai";

const settingsSchema = z.object({
  clientId: z.string().min(1, "L'ID client est requis"),
  tenantId: z.string().min(1, "L'ID tenant est requis"),
  openaiApiKey: z.string().min(1, "La clé API OpenAI est requise"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const fetchSettings = async () => {
  const { data: msGraphSettings, error: msGraphError } = await supabase
    .from("application_settings")
    .select("*")
    .eq("type", "microsoft_graph" as ApplicationSettingType);

  if (msGraphError) throw msGraphError;

  const { data: openaiSettings, error: openaiError } = await supabase
    .from("application_settings")
    .select("*")
    .eq("type", "openai" as ApplicationSettingType);

  if (openaiError) throw openaiError;

  const msGraphFormattedSettings = msGraphSettings.reduce((acc: { [key: string]: string }, setting) => {
    acc[setting.key === "client_id" ? "clientId" : "tenantId"] = setting.value;
    return acc;
  }, {});

  const openaiFormattedSettings = openaiSettings.reduce((acc: { [key: string]: string }, setting) => {
    if (setting.key === "api_key") {
      acc["openaiApiKey"] = setting.value;
    }
    return acc;
  }, {});

  return { ...msGraphFormattedSettings, ...openaiFormattedSettings };
};

export const GeneralSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      clientId: settings?.clientId || "",
      tenantId: settings?.tenantId || "",
      openaiApiKey: settings?.openaiApiKey || "",
    },
    values: settings,
  });

  const mutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      // Suppression des paramètres Microsoft Graph existants
      const { error: deleteGraphError } = await supabase
        .from("application_settings")
        .delete()
        .eq("type", "microsoft_graph" as ApplicationSettingType);

      if (deleteGraphError) throw deleteGraphError;

      // Suppression des paramètres OpenAI existants
      const { error: deleteOpenAIError } = await supabase
        .from("application_settings")
        .delete()
        .eq("type", "openai" as ApplicationSettingType);

      if (deleteOpenAIError) throw deleteOpenAIError;

      // Insertion des nouveaux paramètres Microsoft Graph
      const { error: insertGraphError } = await supabase
        .from("application_settings")
        .insert([
          {
            key: "client_id",
            value: values.clientId,
            type: "microsoft_graph" as ApplicationSettingType,
          },
          {
            key: "tenant_id",
            value: values.tenantId,
            type: "microsoft_graph" as ApplicationSettingType,
          },
        ]);

      if (insertGraphError) throw insertGraphError;

      // Insertion des nouveaux paramètres OpenAI
      const { error: insertOpenAIError } = await supabase
        .from("application_settings")
        .insert([
          {
            key: "api_key",
            value: values.openaiApiKey,
            type: "openai" as ApplicationSettingType,
          },
        ]);

      if (insertOpenAIError) throw insertOpenAIError;
    },
    onSuccess: () => {
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres ont été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["appSettings"] });
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

  const testMicrosoftConnection = async () => {
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

  const testOpenAIConnection = async () => {
    const formValues = form.getValues();
    
    if (!formValues.openaiApiKey) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord sauvegarder la clé API OpenAI.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("test-openai-connection", {
        body: { apiKey: formValues.openaiApiKey },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Connexion réussie",
          description: "La connexion à l'API OpenAI a été établie avec succès.",
        });
      } else {
        throw new Error(data?.message || "Échec du test de connexion");
      }
    } catch (error) {
      console.error("Erreur lors du test de connexion OpenAI:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à l'API OpenAI. Vérifiez votre clé API.",
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
        <div className="mb-6">
          <h3 className="text-lg font-medium">Paramètres Microsoft Graph</h3>
          <p className="text-sm text-muted-foreground">
            Configurez les identifiants de connexion pour l'API Microsoft Graph.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="space-y-8">
            <div className="space-y-4">
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
                  type="button" 
                  variant="secondary"
                  onClick={testMicrosoftConnection}
                  disabled={mutation.status === 'loading'}
                >
                  Tester la connexion Microsoft
                </Button>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium">Paramètres OpenAI</h3>
                <p className="text-sm text-muted-foreground">
                  Configurez votre clé API pour l'intégration avec OpenAI.
                </p>
              </div>

              <FormField
                control={form.control}
                name="openaiApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clé API OpenAI</FormLabel>
                    <FormControl>
                      <Input placeholder="Entrez votre clé API OpenAI..." type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 mt-4">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={testOpenAIConnection}
                  disabled={mutation.status === 'loading'}
                >
                  Tester la connexion OpenAI
                </Button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit"
                disabled={mutation.status === 'loading'}
              >
                {mutation.status === 'loading' ? "Sauvegarde en cours..." : "Sauvegarder tous les paramètres"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
