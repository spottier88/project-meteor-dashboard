import { APITokenCard } from "./APITokenCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Token {
  id: string;
  name: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  scopes: any;
}

interface APITokenListProps {
  tokens: Token[];
  isLoading: boolean;
  onTokenRevoked: () => void;
}

export function APITokenList({ tokens, isLoading, onTokenRevoked }: APITokenListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucun token API créé pour le moment.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Créez votre premier token pour accéder à l'API Meteor.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tokens.map((token) => (
        <APITokenCard key={token.id} token={token} onRevoked={onTokenRevoked} />
      ))}
    </div>
  );
}
