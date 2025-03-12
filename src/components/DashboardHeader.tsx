import React from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

export const DashboardHeader = () => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin } = usePermissionsContext();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    });
    router.push("/login");
  };
  
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link to="/" className="font-semibold">
          Tableau de bord
        </Link>
        
        <div className="ml-auto flex items-center space-x-4">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                Administration
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.user_metadata?.avatar_url as string} alt={session?.user?.email as string} />
                  <AvatarFallback>{session?.user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSignOut}>Se déconnecter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
