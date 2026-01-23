
/**
 * @component FavoriteProjects
 * @description Affiche la liste des projets favoris de l'utilisateur sur le tableau de bord.
 * Permet un accès rapide aux projets marqués comme favoris.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavoriteProjects } from "@/hooks/useFavoriteProjects";
import { useNavigate } from "react-router-dom";
import { Star, StarOff, ExternalLink, Folder } from "lucide-react";
import { StatusIcon } from "@/components/project/StatusIcon";
import { ProjectStatus } from "@/types/project";
import { cn } from "@/lib/utils";

export const FavoriteProjects = () => {
  const navigate = useNavigate();
  const { favorites, isLoading, removeFavorite, isToggling } = useFavoriteProjects();

  // Limiter à 5 projets affichés
  const displayedFavorites = favorites.slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Mes projets favoris
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Mes projets favoris
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Folder className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun projet favori</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate("/projects")}
              className="mt-2"
            >
              Parcourir les projets
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedFavorites.map((favorite) => (
              <div
                key={favorite.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  "hover:bg-muted/50 transition-colors cursor-pointer group"
                )}
                onClick={() => navigate(`/projects/${favorite.project_id}`)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <StatusIcon 
                    status={favorite.project.status as ProjectStatus} 
                    className="h-5 w-5 shrink-0" 
                  />
                  <span className="text-sm font-medium truncate">
                    {favorite.project.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(favorite.project_id);
                    }}
                    disabled={isToggling}
                    title="Retirer des favoris"
                  >
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
            
            {favorites.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-muted-foreground"
                onClick={() => navigate("/projects")}
              >
                Voir tous les favoris ({favorites.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
