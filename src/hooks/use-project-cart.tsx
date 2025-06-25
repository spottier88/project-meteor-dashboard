
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useProjectCart = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthContext();

  console.log("[useProjectCart] État d'authentification:", { 
    hasUser: !!user, 
    userId: user?.id,
    isAuthenticated 
  });

  const getStorageKey = () => {
    return user?.id ? `projectCart_${user.id}` : null;
  };

  useEffect(() => {
    const storageKey = getStorageKey();
    console.log("[useProjectCart] Initialisation avec clé de stockage:", storageKey);
    
    if (storageKey) {
      const savedCart = localStorage.getItem(storageKey);
      console.log("[useProjectCart] Panier sauvegardé trouvé:", savedCart);
      
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        queryClient.setQueryData(["projectCart", user?.id], cartData);
        console.log("[useProjectCart] Panier restauré:", cartData);
      }
    }

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[useProjectCart] Changement d'authentification:", event);
      
      if (event === "SIGNED_OUT") {
        // Vider le panier lors de la déconnexion
        console.log("[useProjectCart] Vidage du panier lors de la déconnexion");
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
  }, [queryClient, user?.id]);

  const { data: cartItems = [] } = useQuery({
    queryKey: ["projectCart", user?.id],
    queryFn: () => {
      const storageKey = getStorageKey();
      console.log("[useProjectCart] Récupération du panier avec clé:", storageKey);
      
      if (!storageKey) {
        console.log("[useProjectCart] Pas de clé de stockage, retour panier vide");
        return [];
      }
      
      const savedCart = localStorage.getItem(storageKey);
      const result = savedCart ? JSON.parse(savedCart) : [];
      console.log("[useProjectCart] Panier récupéré:", result);
      return result;
    },
    initialData: [],
    enabled: !!user?.id && isAuthenticated,
  });

  console.log("[useProjectCart] Éléments du panier actuel:", cartItems);

  const { mutate: addToCart } = useMutation({
    mutationFn: async (projectId: string) => {
      console.log("[useProjectCart] Ajout au panier:", projectId);
      const storageKey = getStorageKey();
      if (!storageKey) {
        console.log("[useProjectCart] Pas de clé de stockage pour l'ajout");
        return [];
      }
      
      const currentCart = queryClient.getQueryData<string[]>(["projectCart", user?.id]) || [];
      const newCart = [...new Set([...currentCart, projectId])];
      
      console.log("[useProjectCart] Nouveau panier après ajout:", newCart);
      localStorage.setItem(storageKey, JSON.stringify(newCart));
      return newCart;
    },
    onSuccess: (newCart) => {
      console.log("[useProjectCart] Succès de l'ajout, mise à jour du cache:", newCart);
      queryClient.setQueryData(["projectCart", user?.id], newCart);
    },
  });

  const { mutate: addMultipleToCart } = useMutation({
    mutationFn: async (projectIds: string[]) => {
      console.log("[useProjectCart] Ajout multiple au panier:", projectIds);
      const storageKey = getStorageKey();
      if (!storageKey) {
        console.log("[useProjectCart] Pas de clé de stockage pour l'ajout multiple");
        return [];
      }
      
      const currentCart = queryClient.getQueryData<string[]>(["projectCart", user?.id]) || [];
      const newCart = [...new Set([...currentCart, ...projectIds])];
      
      console.log("[useProjectCart] Nouveau panier après ajout multiple:", newCart);
      localStorage.setItem(storageKey, JSON.stringify(newCart));
      return newCart;
    },
    onSuccess: (newCart) => {
      console.log("[useProjectCart] Succès de l'ajout multiple, mise à jour du cache:", newCart);
      queryClient.setQueryData(["projectCart", user?.id], newCart);
    },
  });

  const { mutate: removeFromCart } = useMutation({
    mutationFn: async (projectId: string) => {
      console.log("[useProjectCart] Suppression du panier:", projectId);
      const storageKey = getStorageKey();
      if (!storageKey) {
        console.log("[useProjectCart] Pas de clé de stockage pour la suppression");
        return [];
      }
      
      const currentCart = queryClient.getQueryData<string[]>(["projectCart", user?.id]) || [];
      const newCart = currentCart.filter(id => id !== projectId);
      
      console.log("[useProjectCart] Nouveau panier après suppression:", newCart);
      localStorage.setItem(storageKey, JSON.stringify(newCart));
      return newCart;
    },
    onSuccess: (newCart) => {
      console.log("[useProjectCart] Succès de la suppression, mise à jour du cache:", newCart);
      queryClient.setQueryData(["projectCart", user?.id], newCart);
    },
  });

  const { mutate: clearCart } = useMutation({
    mutationFn: async () => {
      console.log("[useProjectCart] Vidage du panier");
      const storageKey = getStorageKey();
      if (!storageKey) {
        console.log("[useProjectCart] Pas de clé de stockage pour le vidage");
        return [];
      }
      
      localStorage.removeItem(storageKey);
      return [];
    },
    onSuccess: () => {
      console.log("[useProjectCart] Succès du vidage, mise à jour du cache");
      queryClient.setQueryData(["projectCart", user?.id], []);
    },
  });

  return {
    cartItems,
    addToCart,
    addMultipleToCart,
    removeFromCart,
    clearCart,
  };
};
