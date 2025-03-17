
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Copy, Check } from 'lucide-react';
import { useActivityTypes } from '@/hooks/useActivityTypes';
import { useToast } from '@/hooks/use-toast';

export const ActivityTypeCodesDialog = () => {
  const { data: activityTypes, isLoading } = useActivityTypes(true, true);
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    const formattedCode = `#A-${code}#`;
    navigator.clipboard.writeText(formattedCode)
      .then(() => {
        setCopiedCode(code);
        toast({
          title: "Code copié",
          description: `Le code ${formattedCode} a été copié dans le presse-papier.`,
        });
        
        // Réinitialiser l'état après 2 secondes
        setTimeout(() => {
          setCopiedCode(null);
        }, 2000);
      })
      .catch(err => {
        toast({
          title: "Erreur de copie",
          description: "Impossible de copier le code. " + err.message,
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="text-blue-500 hover:text-blue-700">
          Voir les codes disponibles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Codes types d'activités disponibles</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground">
            Chargement des types d'activités...
          </div>
        ) : activityTypes && activityTypes.length > 0 ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Voici les codes des types d'activités auxquels vous avez accès. Cliquez sur le bouton de copie pour copier le format <span className="font-mono">#A-XXX#</span> attendu.
            </p>
            
            <div className="border rounded-md">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Code</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Type d'activité</th>
                    <th className="px-4 py-2 text-center text-sm font-medium w-16">Copier</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activityTypes.map(type => (
                    <tr key={type.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm">
                          A-{type.code}
                        </code>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: type.color || '#cbd5e1' }}
                          />
                          {type.label}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleCopyCode(type.code)}
                        >
                          {copiedCode === type.code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="secondary">Fermer</Button>
              </DialogClose>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <Info className="h-6 w-6 mx-auto text-amber-500" />
            <p className="text-muted-foreground">
              Vous n'avez accès à aucun type d'activité.
            </p>
            <DialogClose asChild>
              <Button variant="secondary" className="mt-4 mx-auto">Fermer</Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
