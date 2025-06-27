
/**
 * @component DashboardHeader
 * @description En-tête principal du tableau de bord de l'application.
 * Affiche le titre de la page, la navigation principale, les boutons d'action
 * (création de projet, de revue) et les indicateurs (tâches, panier de projets).
 * S'adapte en fonction des permissions de l'utilisateur connecté.
 */

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Link, useNavigate } from "react-router-dom";
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { ShoppingCart, History, Plus } from 'lucide-react';
import { useProjectCart } from '@/hooks/use-project-cart';
import { CartButton } from '@/components/cart/CartButton';
import { ProjectCart } from '@/components/cart/ProjectCart';
import { TasksIndicator } from '@/components/task/TasksIndicator';

interface DashboardHeaderProps {
  onNewProject?: () => void;
  onNewReview?: () => void;
  onNewFrameworkNote?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onNewProject, 
  onNewReview
}) => {
  const navigate = useNavigate();
  const { isAdmin, isManager, hasRole, isTimeTracker } = usePermissionsContext();
  const showTeamActivities = isAdmin || isManager || hasRole('chef_projet');
  const { cartItems } = useProjectCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Déterminer si nous sommes sur la page des projets ou sur le dashboard
  const isOnProjectsPage = window.location.pathname === '/projects';

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="border-b w-full">
        <div className="flex h-16 items-center px-4 container">
          <div className="flex items-center flex-1">
            <h1 className="text-3xl font-bold mr-8">
              {isOnProjectsPage ? 'Tous les projets' : 'Tableau de bord'}
            </h1>
            
            {(isTimeTracker || isAdmin) && (
              <NavigationMenu>
                <NavigationMenuList className="gap-2">
                  <NavigationMenuItem>
                    <Link to="/activities">
                      <Button variant="ghost">
                        Mes activités
                      </Button>
                    </Link>
                  </NavigationMenuItem>
                  {showTeamActivities && (
                    <NavigationMenuItem>
                      <Link to="/team-activities">
                        <Button variant="ghost">
                          Activités de l'équipe
                        </Button>
                      </Link>
                    </NavigationMenuItem>
                  )}
                  <NavigationMenuItem>
                    <Link to="/my-tasks">
                      <Button variant="ghost">
                        Mes tâches
                      </Button>
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
            
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <TasksIndicator />
          
            <div onClick={() => setIsCartOpen(true)}>
              <CartButton />
            </div>
            
            <Button onClick={onNewReview} variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              Nouvelle revue
            </Button>
            <Button onClick={onNewProject} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </div>
      </div>
      <ProjectCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};
