import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Database } from "@/integrations/supabase/types";

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  review_actions: Database["public"]["Tables"]["review_actions"]["Row"][];
};

interface ReviewListProps {
  projectId: string;
}

export const ReviewList = ({ projectId }: ReviewListProps) => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, review_actions(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });

  if (isLoading) return <div>Chargement des revues...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des revues</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews?.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm">
                    {new Date(review.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Météo</span>
                  <span className="text-sm">{review.weather}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Progression</span>
                  <span className="text-sm">{review.progress}</span>
                </div>
                {review.comment && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Situation générale</span>
                    <p className="text-sm mt-1">{review.comment}</p>
                  </div>
                )}
                {review.review_actions?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Actions</span>
                    <ul className="list-disc list-inside mt-1">
                      {review.review_actions.map((action) => (
                        <li key={action.id} className="text-sm">
                          {action.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
