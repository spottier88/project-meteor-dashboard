
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Portfolio } from "@/types/portfolio";
import { Edit, Trash2, FolderOpen, Settings } from "lucide-react";

interface PortfolioCardProps {
  portfolio: Portfolio;
  onEdit: (portfolio: Portfolio) => void;
  onDelete: (portfolioId: string) => void;
  onViewProjects: (portfolio: Portfolio) => void;
  onManageProjects: (portfolio: Portfolio) => void;
  canManage: boolean;
}

export const PortfolioCard = ({ 
  portfolio, 
  onEdit, 
  onDelete, 
  onViewProjects, 
  onManageProjects,
  canManage 
}: PortfolioCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif':
        return 'bg-green-100 text-green-800';
      case 'suspendu':
        return 'bg-yellow-100 text-yellow-800';
      case 'termine':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'actif':
        return 'Actif';
      case 'suspendu':
        return 'Suspendu';
      case 'termine':
        return 'Terminé';
      default:
        return status;
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {portfolio.name}
          </CardTitle>
          <Badge className={getStatusColor(portfolio.status)}>
            {getStatusLabel(portfolio.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {portfolio.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {portfolio.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Projets</span>
            <span className="font-medium">{portfolio.project_count || 0}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Terminés</span>
            <span className="font-medium">{portfolio.completed_projects || 0}</span>
          </div>

          {portfolio.average_completion !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Avancement moyen</span>
                <span className="font-medium">{portfolio.average_completion}%</span>
              </div>
              <Progress value={portfolio.average_completion} className="h-2" />
            </div>
          )}
        </div>

        {portfolio.budget_total && (
          <div className="flex justify-between text-sm">
            <span>Budget total</span>
            <span className="font-medium">{portfolio.budget_total.toLocaleString()}€</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProjects(portfolio)}
            className="flex-1"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Voir
          </Button>
          
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageProjects(portfolio)}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gérer
            </Button>
          )}
        </div>
        
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(portfolio)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(portfolio.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
