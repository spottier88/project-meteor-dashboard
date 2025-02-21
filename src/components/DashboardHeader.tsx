
import React from 'react';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { UserInfo } from "./UserInfo";
import { Link } from "react-router-dom";
import { usePermissionsContext } from '@/contexts/PermissionsContext';

interface DashboardHeaderProps {
  onNewProject?: () => void;
  onNewReview?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onNewProject, onNewReview }) => {
  const { isAdmin, isManager, hasRole } = usePermissionsContext();
  const showTeamActivities = isAdmin || isManager || hasRole('chef_projet');

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 container">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <Button variant="ghost">
                  Dashboard
                </Button>
              </Link>
            </NavigationMenuItem>
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
        <div className="ml-auto flex items-center gap-2">
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
          <UserInfo />
        </div>
      </div>
    </div>
  );
};

