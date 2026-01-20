/**
 * @component RatingsList
 * @description Liste des évaluations pour la page d'administration
 * Affiche les évaluations avec les informations utilisateur, note, commentaire et date
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StarRating } from "./StarRating";
import type { AppRatingWithUser } from "@/types/rating";

interface RatingsListProps {
  ratings: AppRatingWithUser[];
}

export const RatingsList = ({ ratings }: RatingsListProps) => {
  // Formater le nom de l'utilisateur
  const formatUserName = (rating: AppRatingWithUser) => {
    if (rating.profiles?.first_name && rating.profiles?.last_name) {
      return `${rating.profiles.first_name} ${rating.profiles.last_name}`;
    }
    return rating.profiles?.email || "Utilisateur inconnu";
  };

  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune évaluation pour le moment
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="hidden md:table-cell">Commentaire</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ratings.map((rating) => (
            <TableRow key={rating.id}>
              <TableCell className="font-medium">
                {formatUserName(rating)}
              </TableCell>
              <TableCell>
                <StarRating value={rating.rating} readonly size="sm" />
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-md">
                {rating.comment ? (
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {rating.comment}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground/50 italic">
                    Aucun commentaire
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(rating.created_at), "dd MMM yyyy", {
                  locale: fr,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
