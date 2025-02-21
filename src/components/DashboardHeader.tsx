
import React from 'react';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { UserInfo } from "./UserInfo";
import { Link } from "react-router-dom";
import { usePermissionsContext } from '@/contexts/PermissionsContext';

export const DashboardHeader = () => {
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
        <div className="ml-auto">
          <UserInfo />
        </div>
      </div>
    </div>
  );
};
