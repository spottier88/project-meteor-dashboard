
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ProjectCartItem {
  id: string;
  title: string;
}

interface ProjectCartContextType {
  cartItems: ProjectCartItem[];
  addToCart: (project: ProjectCartItem) => void;
  removeFromCart: (projectId: string) => void;
  clearCart: () => void;
  isInCart: (projectId: string) => boolean;
}

const ProjectCartContext = createContext<ProjectCartContextType | undefined>(undefined);

export const useProjectCart = () => {
  const context = useContext(ProjectCartContext);
  if (context === undefined) {
    throw new Error('useProjectCart must be used within a ProjectCartProvider');
  }
  return context;
};

export const ProjectCartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<ProjectCartItem[]>([]);

  // Charger le panier depuis le localStorage au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem('projectCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
        localStorage.removeItem('projectCart');
      }
    }
  }, []);

  // Sauvegarder le panier dans le localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('projectCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (project: ProjectCartItem) => {
    if (!isInCart(project.id)) {
      setCartItems(prev => [...prev, project]);
    }
  };

  const removeFromCart = (projectId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== projectId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (projectId: string) => {
    return cartItems.some(item => item.id === projectId);
  };

  return (
    <ProjectCartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart
    }}>
      {children}
    </ProjectCartContext.Provider>
  );
};
