/**
 * @page AppRatingsManagement
 * @description Page d'administration pour consulter les évaluations de l'application
 * Affiche les statistiques globales et la liste détaillée des évaluations utilisateur
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { RatingsStats } from "@/components/rating/RatingsStats";
import { RatingsList } from "@/components/rating/RatingsList";
import type { AppRatingWithUser, RatingsStats as RatingsStatsType } from "@/types/rating";

export const AppRatingsManagement = () => {
  const navigate = useNavigate();
  const [filterRating, setFilterRating] = useState<string>("all");

  // Récupérer toutes les évaluations avec les profils utilisateur
  const { data: ratings = [], isLoading, refetch } = useQuery({
    queryKey: ["adminAppRatings"],
    queryFn: async () => {
      // Récupérer les évaluations
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("app_ratings")
        .select("*")
        .order("created_at", { ascending: false });

      if (ratingsError) throw ratingsError;

      // Récupérer les profils correspondants
      const userIds = ratingsData.map((r) => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combiner les données
      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
      const data = ratingsData.map((rating) => ({
        ...rating,
        profiles: profilesMap.get(rating.user_id) || null,
      }));
      return data as AppRatingWithUser[];
    },
  });

  // Calculer les statistiques
  const stats: RatingsStatsType = {
    totalRatings: ratings.length,
    averageRating:
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0,
    distribution: ratings.reduce(
      (acc, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      },
      {} as { [key: number]: number }
    ),
  };

  // Filtrer les évaluations selon la note sélectionnée
  const filteredRatings =
    filterRating === "all"
      ? ratings
      : ratings.filter((r) => r.rating === parseInt(filterRating));

  return (
    <div className="container mx-auto py-8 px-4">
      {/* En-tête */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Star className="h-8 w-8 text-amber-500" />
              Évaluations de l'application
            </h1>
            <p className="text-muted-foreground">
              Consultez les avis des utilisateurs sur l'application
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="mb-8">
        <RatingsStats stats={stats} />
      </div>

      {/* Liste des évaluations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Détail des évaluations</CardTitle>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par note" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les notes</SelectItem>
              <SelectItem value="5">5 étoiles</SelectItem>
              <SelectItem value="4">4 étoiles</SelectItem>
              <SelectItem value="3">3 étoiles</SelectItem>
              <SelectItem value="2">2 étoiles</SelectItem>
              <SelectItem value="1">1 étoile</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des évaluations...
            </div>
          ) : (
            <RatingsList ratings={filteredRatings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppRatingsManagement;
