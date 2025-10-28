import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScopeSelector } from "./ScopeSelector";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface APITokenFormProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  expires_at?: Date;
  scopes: {
    access_level: string;
    pole_ids: string[];
    direction_ids: string[];
    service_ids: string[];
    project_ids: string[];
    data_types: string[];
  };
}

// Fonction pour générer un token aléatoire sécurisé
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Fonction pour hasher le token avec SHA-256
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function APITokenForm({ onSuccess, onCancel }: APITokenFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [scopes, setScopes] = useState<FormData['scopes']>({
    access_level: 'read_only',
    pole_ids: [],
    direction_ids: [],
    service_ids: [],
    project_ids: [],
    data_types: ['projects'],
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Générer le token en clair
      const plainToken = generateSecureToken();
      
      // Hasher le token avant de le stocker
      const hashedToken = await hashToken(plainToken);

      // Créer le token dans la base de données
      const { error } = await supabase
        .from('api_tokens')
        .insert({
          name: data.name,
          token: hashedToken,
          created_by: user.id,
          expires_at: hasExpiration && expirationDate ? expirationDate.toISOString() : null,
          scopes: scopes,
        });

      if (error) throw error;

      // Retourner le token en clair (uniquement cette fois)
      onSuccess(plainToken);
    } catch (error: any) {
      console.error('Error creating token:', error);
      toast.error("Erreur lors de la création du token: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du token *</Label>
        <Input
          id="name"
          placeholder="Ex: Intégration ERP"
          {...register('name', { required: 'Le nom est requis' })}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Date d'expiration</Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="has-expiration" className="text-sm font-normal">
              Définir une expiration
            </Label>
            <Switch
              id="has-expiration"
              checked={hasExpiration}
              onCheckedChange={setHasExpiration}
            />
          </div>
        </div>
        {hasExpiration && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expirationDate ? format(expirationDate, "PPP", { locale: fr }) : "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={expirationDate}
                onSelect={setExpirationDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <ScopeSelector scopes={scopes} onChange={setScopes} />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer le token'}
        </Button>
      </div>
    </form>
  );
}
