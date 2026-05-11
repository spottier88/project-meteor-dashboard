/**
 * @component UserNameWithStatus
 * @description Affiche le nom formaté d'un utilisateur et un badge "Inactif"
 * lorsque l'utilisateur correspondant est désactivé. Utilisé dans les vues
 * historiques (tâches, assignations) où l'on conserve le nom d'origine.
 */

import { Badge } from "@/components/ui/badge";
import { formatUserName } from "@/utils/formatUserName";

interface ProfileLite {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active?: boolean | null;
}

interface UserNameWithStatusProps {
  email?: string;
  profiles?: ProfileLite[] | null;
}

export const UserNameWithStatus = ({ email, profiles }: UserNameWithStatusProps) => {
  const name = formatUserName(email, profiles);
  const profile = email ? profiles?.find((p) => p.email === email) : undefined;
  const isInactive = profile?.is_active === false;

  return (
    <span className="inline-flex items-center gap-2">
      {name}
      {isInactive && <Badge variant="outline" className="text-xs">Inactif</Badge>}
    </span>
  );
};
