import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APITokenList } from "@/components/api-tokens/APITokenList";
import { APITokenForm } from "@/components/api-tokens/APITokenForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function APITokenManagement() {
  const navigate = useNavigate();
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Tokens API</h1>
            <p className="text-muted-foreground">
              Créez et gérez les tokens d'accès à l'API Meteor
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Token
          </Button>
        </div>
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
    </div>
  );
}
