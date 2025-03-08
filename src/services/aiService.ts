
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export const aiService = {
  /**
   * Crée une nouvelle conversation
   */
  async createConversation(title: string = 'Nouvelle conversation'): Promise<string | null> {
    // Récupérer la session actuelle pour obtenir l'ID utilisateur
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      console.error('Utilisateur non authentifié lors de la création de conversation');
      return null;
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        title,
        user_id: sessionData.session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      return null;
    }

    return data.id;
  },

  /**
   * Récupère toutes les conversations de l'utilisateur
   */
  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Récupère une conversation spécifique avec ses messages
   */
  async getConversation(conversationId: string): Promise<{ conversation: Conversation | null, messages: Message[] }> {
    // Récupérer la conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      console.error('Erreur lors de la récupération de la conversation:', conversationError);
      return { conversation: null, messages: [] };
    }

    // Récupérer les messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Erreur lors de la récupération des messages:', messagesError);
      return { conversation, messages: [] };
    }

    // Convertir les messages en type Message avec un rôle correctement typé
    const messages: Message[] = messagesData.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));

    return {
      conversation,
      messages
    };
  },

  /**
   * Envoie un message à l'assistant IA et retourne sa réponse
   */
  async sendMessage(message: string, conversationId?: string): Promise<{ 
    reply: Message | null, 
    conversationId: string | null 
  }> {
    try {
      // Si aucun ID de conversation n'est fourni, en créer une nouvelle
      let finalConversationId = conversationId;
      if (!finalConversationId) {
        finalConversationId = await this.createConversation();
        if (!finalConversationId) {
          throw new Error("Impossible de créer une nouvelle conversation");
        }
      }

      // Récupérer les messages existants si c'est une conversation en cours
      const { messages: existingMessages } = await this.getConversation(finalConversationId);

      // Ajouter le message de l'utilisateur à la base de données
      const { error: insertError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: finalConversationId,
          role: 'user' as const,
          content: message
        });

      if (insertError) {
        console.error('Erreur lors de la sauvegarde du message:', insertError);
      }

      // Préparer les messages à envoyer à l'API
      const messagesToSend: Message[] = [
        ...existingMessages,
        { role: 'user' as const, content: message }
      ];

      // Appeler la fonction edge pour traiter la demande
      const response = await fetch(`${window.location.origin}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          messages: messagesToSend,
          conversationId: finalConversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'appel à l\'assistant IA');
      }

      const data = await response.json();
      
      // Mettre à jour le titre de la conversation s'il s'agit de la première interaction
      if (existingMessages.length === 0) {
        // Générer un titre à partir du premier message de l'utilisateur (limité à 30 caractères)
        const title = message.length > 30 
          ? message.substring(0, 27) + '...' 
          : message;
          
        await supabase
          .from('ai_conversations')
          .update({ title })
          .eq('id', finalConversationId);
      }

      return {
        reply: data.message,
        conversationId: finalConversationId
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      return { reply: null, conversationId: conversationId || null };
    }
  },

  /**
   * Supprime une conversation et tous ses messages
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      return false;
    }

    return true;
  }
};
