
import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function GeneralSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["application-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_settings")
        .select("*")
        .eq("type", "microsoft_graph");

      if (error) {
        toast.error("Erreur lors du chargement des paramètres");
        throw error;
      }

      return data || [];
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Settings className="h-8 w-8" />
        <h1 className="text-2xl font-bold">Paramètres généraux</h1>
      </div>

      <div className="max-w-2xl">
        <GeneralSettingsForm settings={settings} isLoading={isLoading} />
      </div>
    </div>
  );
}
