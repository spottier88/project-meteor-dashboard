import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const useProjectCart = () => {
  const queryClient = useQueryClient();

  // Load cart from localStorage on initial mount
  useEffect(() => {
    const savedCart = localStorage.getItem("projectCart");
    if (savedCart) {
      queryClient.setQueryData(["projectCart"], JSON.parse(savedCart));
    }
  }, [queryClient]);

  const { data: cartItems = [] } = useQuery({
    queryKey: ["projectCart"],
    queryFn: () => {
      const savedCart = localStorage.getItem("projectCart");
      return savedCart ? JSON.parse(savedCart) : [];
    },
    initialData: [],
  });

  const { mutate: addToCart } = useMutation({
    mutationFn: (projectId: string) => {
      const currentCart = queryClient.getQueryData<string[]>(["projectCart"]) || [];
      const newCart = [...new Set([...currentCart, projectId])];
      localStorage.setItem("projectCart", JSON.stringify(newCart));
      return newCart;
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["projectCart"], newCart);
    },
  });

  const { mutate: removeFromCart } = useMutation({
    mutationFn: (projectId: string) => {
      const currentCart = queryClient.getQueryData<string[]>(["projectCart"]) || [];
      const newCart = currentCart.filter(id => id !== projectId);
      localStorage.setItem("projectCart", JSON.stringify(newCart));
      return newCart;
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["projectCart"], newCart);
    },
  });

  const { mutate: clearCart } = useMutation({
    mutationFn: () => {
      localStorage.removeItem("projectCart");
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(["projectCart"], []);
    },
  });

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
  };
};