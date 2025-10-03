/**
 * Page de monitoring des appels IA
 * 
 * Affiche les statistiques d'utilisation de l'IA pour la génération de notes de cadrage
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart3, MessageSquare, User, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AIMessageStats {
  total_messages: number;
  total_conversations: number;
  messages_by_user: Array<{
    user_id: string;
    user_email: string;
    count: number;
  }>;
  recent_conversations: Array<{
    id: string;
    title: string;
    user_email: string;
    created_at: string;
    message_count: number;
  }>;
}

export const AIMonitoring = () => {
  const navigate = useNavigate();

  // Récupération des statistiques globales
  const { data: stats, isLoading } = useQuery({
    queryKey: ["ai-monitoring-stats"],
    queryFn: async () => {
      // Total des messages
      const { count: totalMessages } = await supabase
        .from("ai_messages")
        .select("*", { count: "exact", head: true });

      // Total des conversations
      const { count: totalConversations } = await supabase
        .from("ai_conversations")
        .select("*", { count: "exact", head: true });

      // Messages par utilisateur
      const { data: messagesByUser } = await supabase
        .from("ai_conversations")
        .select(`
          user_id,
          profiles:user_id (email),
          ai_messages (id)
        `);

      const userStats = messagesByUser?.reduce((acc, conv) => {
        const userId = conv.user_id;
        const userEmail = (conv.profiles as any)?.email || "Inconnu";
        const messageCount = (conv.ai_messages as any[])?.length || 0;

        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_email: userEmail,
            count: 0,
          };
        }
        acc[userId].count += messageCount;
        return acc;
      }, {} as Record<string, { user_id: string; user_email: string; count: number }>);

      const messagesByUserArray = Object.values(userStats || {}).sort(
        (a, b) => b.count - a.count
      );

      // Conversations récentes
      const { data: recentConversations } = await supabase
        .from("ai_conversations")
        .select(`
          id,
          title,
          created_at,
          profiles:user_id (email),
          ai_messages (id)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      const recentConversationsFormatted = recentConversations?.map((conv) => ({
        id: conv.id,
        title: conv.title,
        user_email: (conv.profiles as any)?.email || "Inconnu",
        created_at: conv.created_at,
        message_count: (conv.ai_messages as any[])?.length || 0,
      }));

      return {
        total_messages: totalMessages || 0,
        total_conversations: totalConversations || 0,
        messages_by_user: messagesByUserArray,
        recent_conversations: recentConversationsFormatted || [],
      } as AIMessageStats;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Monitoring IA</h1>
        <p className="text-muted-foreground">
          Statistiques d'utilisation de l'IA pour la génération de notes de cadrage
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_messages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Messages échangés avec l'IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_conversations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sessions de génération
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.messages_by_user.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs ayant utilisé l'IA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Utilisation par utilisateur */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Utilisation par utilisateur</CardTitle>
          <CardDescription>
            Nombre de messages générés par utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.messages_by_user.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune utilisation enregistrée pour le moment.
              </p>
            ) : (
              stats?.messages_by_user.slice(0, 10).map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.user_email}</span>
                  </div>
                  <span className="text-sm font-medium">{user.count} messages</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversations récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Conversations récentes</CardTitle>
          <CardDescription>
            Dernières sessions de génération de notes de cadrage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recent_conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune conversation enregistrée pour le moment.
              </p>
            ) : (
              stats?.recent_conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{conv.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {conv.user_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(conv.created_at), "d MMM yyyy à HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {conv.message_count} messages
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
