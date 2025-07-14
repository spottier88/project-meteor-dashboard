
/**
 * @component DashboardHeader
 * @description En-tête principal du tableau de bord de l'application.
 * Affiche le titre de la page, la navigation principale et les indicateurs 
 * (tâches, panier de projets). S'adapte en fonction des permissions de 
 * l'utilisateur connecté.
 */

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useProjectCart } from '@/hooks/use-project-cart';
import { CartButton } from '@/components/cart/CartButton';
import { ProjectCart } from '@/components/cart/ProjectCart';
import { TasksIndicator } from '@/components/task/TasksIndicator';
import { ArrowLeft } from 'lucide-react';

interface DashboardHeaderProps {
  onNewProject?: () => void;
  onNewReview?: () => void;
  onNewFrameworkNote?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onNewProject, 
  onNewReview
}) => {
  const location = useLocation();
  const { isAdmin, isManager, hasRole, isTimeTracker } = usePermissionsContext();
  const { cartItems } = useProjectCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Déterminer si nous sommes sur la page des projets ou sur le dashboard
  const isOnProjectsPage = location.pathname === '/projects';

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="border-b w-full">
        <div className="flex h-16 items-center px-4 container">
          <div className="flex items-center flex-1">
            {isOnProjectsPage && (
              <Link to="/" className="mr-4">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </Link>
            )}
            
            <h1 className="text-3xl font-bold">
              {isOnProjectsPage ? 'Tous les projets' : 'Tableau de bord'}
            </h1>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <TasksIndicator />
          
            <div onClick={() => setIsCartOpen(true)}>
              <CartButton />
            </div>
          </div>
        </div>
      </div>
      <ProjectCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};
