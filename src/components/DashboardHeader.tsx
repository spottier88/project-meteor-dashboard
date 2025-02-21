
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
    <div className="border-b">
      <div className="flex h-16 items-center px-4 container justify-between">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" className="text-lg font-semibold">
              Tableau de bord
            </Button>
          </Link>

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

        <div className="flex items-center gap-2">
          {onNewProject && (
            <Button variant="outline" onClick={onNewProject}>
              Nouveau projet
            </Button>
          )}
          {onNewReview && (
            <Button variant="outline" onClick={onNewReview}>
              Nouvelle revue
            </Button>
          )}
          <Link to="/cart">
            <Button variant="ghost" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

