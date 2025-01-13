import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

export const useProjectCart = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  // Fonction utilitaire pour générer la clé de stockage unique par utilisateur
  const getStorageKey = () => {
    return user?.id ? `projectCart_${user.id}` : null;
  };

  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        queryClient.setQueryData(["projectCart", user.id], JSON.parse(savedCart));
      }
    }

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Vider le panier lors de la déconnexion
        queryClient.setQueryData(["projectCart", user?.id], []);
        const storageKey = getStorageKey();
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, user]);

  const { data: cartItems = [] } = useQuery({
    queryKey: ["projectCart", user?.id],
    queryFn: () => {
      const storageKey = getStorageKey();
      if (!storageKey) return [];
      const savedCart = localStorage.getItem(storageKey);
      return savedCart ? JSON.parse(savedCart) : [];
    },
    initialData: [],
    enabled: !!user?.id,
  });

  const { mutate: addToCart } = useMutation({
    mutationFn: async (projectId: string) => {
      const storageKey = getStorageKey();
      if (!storageKey) return [];
      const currentCart = queryClient.getQueryData<string[]>(["projectCart", user?.id]) || [];
      const newCart = [...new Set([...currentCart, projectId])];
      localStorage.setItem(storageKey, JSON.stringify(newCart));
      return newCart;
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["projectCart", user?.id], newCart);
    },
  });

  const { mutate: removeFromCart } = useMutation({
    mutationFn: async (projectId: string) => {
      const storageKey = getStorageKey();
      if (!storageKey) return [];
      const currentCart = queryClient.getQueryData<string[]>(["projectCart", user?.id]) || [];
      const newCart = currentCart.filter(id => id !== projectId);
      localStorage.setItem(storageKey, JSON.stringify(newCart));
      return newCart;
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["projectCart", user?.id], newCart);
    },
  });

  const { mutate: clearCart } = useMutation({
    mutationFn: async () => {
      const storageKey = getStorageKey();
      if (!storageKey) return [];
      localStorage.removeItem(storageKey);
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(["projectCart", user?.id], []);
    },
  });

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
  };
};