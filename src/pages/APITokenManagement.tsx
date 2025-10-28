import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { APITokenList } from "@/components/api-tokens/APITokenList";
import { APITokenForm } from "@/components/api-tokens/APITokenForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function APITokenManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const { data: tokens, isLoading, refetch } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleTokenCreated = (token: string) => {
    setCreatedToken(token);
    setIsCreateDialogOpen(false);
    refetch();
    toast.success("Token API créé avec succès");
  };

  const handleCloseCreatedTokenDialog = () => {
    setCreatedToken(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Tokens API</h1>
            <p className="text-muted-foreground mt-2">
              Créez et gérez les tokens d'accès à l'API Meteor
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Token
          </Button>
        </div>

        <APITokenList 
          tokens={tokens || []} 
          isLoading={isLoading} 
          onTokenRevoked={refetch}
        />

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau token API</DialogTitle>
            </DialogHeader>
            <APITokenForm 
              onSuccess={handleTokenCreated}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!createdToken} onOpenChange={handleCloseCreatedTokenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Token API créé</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Votre token a été créé avec succès. <strong>Copiez-le maintenant</strong>, 
                il ne sera plus jamais affiché.
              </p>
              <div className="p-4 bg-muted rounded-md">
                <code className="text-sm break-all">{createdToken}</code>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(createdToken || '');
                  toast.success("Token copié dans le presse-papier");
                }}
                className="w-full"
              >
                Copier le token
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
