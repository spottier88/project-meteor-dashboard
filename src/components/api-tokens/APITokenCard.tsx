import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, Key, Trash2, AlertCircle } from "lucide-react";

interface Token {
  id: string;
  name: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  scopes: any;
}

interface APITokenCardProps {
  token: Token;
  onRevoked: () => void;
}

export function APITokenCard({ token, onRevoked }: APITokenCardProps) {
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      const { error } = await supabase
        .from('api_tokens')
        .update({ is_active: false })
        .eq('id', token.id);

      if (error) throw error;

      toast.success("Token révoqué avec succès");
      onRevoked();
    } catch (error: any) {
      console.error('Error revoking token:', error);
      toast.error("Erreur lors de la révocation du token");
    } finally {
      setIsRevoking(false);
      setShowRevokeDialog(false);
    }
  };

  const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
  const dataTypes = token.scopes?.data_types || [];
  const hasRestrictions = 
    token.scopes?.pole_ids?.length > 0 ||
    token.scopes?.direction_ids?.length > 0 ||
    token.scopes?.service_ids?.length > 0 ||
    token.scopes?.project_ids?.length > 0;

  return (
    <>
      <Card className={!token.is_active || isExpired ? 'opacity-60' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-4 w-4" />
                {token.name}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Créé le {format(new Date(token.created_at), 'PP', { locale: fr })}
              </CardDescription>
            </div>
            {!token.is_active ? (
              <Badge variant="destructive">Révoqué</Badge>
            ) : isExpired ? (
              <Badge variant="destructive">Expiré</Badge>
            ) : (
              <Badge variant="default">Actif</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {token.last_used_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Dernière utilisation: {format(new Date(token.last_used_at), 'Pp', { locale: fr })}
              </span>
            </div>
          )}

          {token.expires_at && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
                Expire le {format(new Date(token.expires_at), 'PP', { locale: fr })}
              </span>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium">Types de données accessibles:</p>
            <div className="flex flex-wrap gap-1">
              {dataTypes.length > 0 ? (
                dataTypes.map((type: string) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="text-xs">Tous</Badge>
              )}
            </div>
          </div>

          {hasRestrictions && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>Périmètre restreint</span>
            </div>
          )}
        </CardContent>

        <CardFooter>
          {token.is_active && !isExpired && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => setShowRevokeDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Révoquer
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer ce token ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le token "{token.name}" ne pourra plus être utilisé
              pour accéder à l'API. Les applications utilisant ce token devront être mises à jour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={isRevoking}>
              {isRevoking ? 'Révocation...' : 'Révoquer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
