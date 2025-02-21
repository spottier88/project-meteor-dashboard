
import React from 'react';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { ShoppingCart } from 'lucide-react';
import { useProjectCart } from '@/hooks/use-project-cart';

interface DashboardHeaderProps {
  onNewProject?: () => void;
  onNewReview?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onNewProject, onNewReview }) => {
  const { isAdmin, isManager, hasRole } = usePermissionsContext();
  const showTeamActivities = isAdmin || isManager || hasRole('chef_projet');
  const { cartItems } = useProjectCart();

  return (

    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
    <div className="border-b">
      <div className="flex h-16 items-center px-4 container justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="flex items-center gap-2">

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
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
      <ProjectCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
      </div>
    </div>
  );
};

