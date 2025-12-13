/**
 * @file PortfolioCard.tsx
 * @description Carte de portefeuille avec actions conditionnelles selon le rôle de l'utilisateur
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortfolioWithStats } from "@/types/portfolio";
import { Edit, Trash2, FolderOpen, Calendar, Euro } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PortfolioCardProps {
  portfolio: PortfolioWithStats;
  onEdit: (portfolio: PortfolioWithStats) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  /** Peut modifier le portefeuille (owner ou manager) */
  canEdit?: boolean;
  /** Peut supprimer le portefeuille (owner uniquement) */
  canDelete?: boolean;
}

export const PortfolioCard = ({ 
  portfolio, 
  onEdit, 
  onDelete, 
  onView,
  canEdit = false,
  canDelete = false,
}: PortfolioCardProps) => {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "actif":
        return "bg-green-100 text-green-800";
      case "suspendu":
        return "bg-yellow-100 text-yellow-800";
      case "terminé":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{portfolio.name}</CardTitle>
          {portfolio.status && (
            <Badge className={getStatusColor(portfolio.status)}>
              {portfolio.status}
            </Badge>
          )}
        </div>
        {portfolio.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {portfolio.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {portfolio.project_count}
            </div>
            <div className="text-xs text-blue-600">Projets</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {portfolio.average_completion}%
            </div>
            <div className="text-xs text-green-600">Avancement</div>
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="space-y-2 text-sm">
          {portfolio.budget_total && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium">{formatCurrency(portfolio.budget_total)}</span>
            </div>
          )}
          
          {portfolio.end_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fin prévue:</span>
              <span className="font-medium">
                {format(new Date(portfolio.end_date), "dd/MM/yyyy", { locale: fr })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link to={`/portfolios/${portfolio.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              Voir
            </Button>
          </Link>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(portfolio)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(portfolio.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
