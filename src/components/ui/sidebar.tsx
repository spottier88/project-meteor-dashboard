
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import { useMemo } from "react";
import {
  BarChart4,
  Calendar,
  ClipboardList,
  FileText,
  FolderKanban,
  PackageOpen,
  Settings,
  User2,
  Users2,
} from "lucide-react";

export function Sidebar() {
  const session = useSession();

  const navigationItems = useMemo(
    () => [
      {
        title: "Projets",
        path: "/",
        icon: <PackageOpen />,
      },
      {
        title: "Activités",
        path: "/activities",
        icon: <Calendar />,
      },
      {
        title: "Monitoring",
        path: "/monitoring",
        icon: <BarChart4 />,
      },
      {
        title: "Utilisateurs",
        path: "/users",
        icon: <Users2 />,
        adminOnly: true,
      },
      {
        title: "Organisation",
        path: "/organization",
        icon: <FolderKanban />,
        adminOnly: true,
      },
      {
        title: "Paramètres généraux",
        path: "/settings",
        icon: <Settings />,
        adminOnly: true,
      },
      {
        title: "Profil",
        path: "/profile",
        icon: <User2 />,
      },
      {
        title: "Notifications",
        path: "/notifications",
        icon: <ClipboardList />,
        adminOnly: true,
      },
      {
        title: "Documentation",
        path: "/docs",
        icon: <FileText />,
      },
    ],
    []
  );

  return (
    <nav className="flex flex-col">
      <ul className="space-y-2">
        {navigationItems.map((item) => {
          if (item.adminOnly && !session) return null;
          return (
            <li key={item.title}>
              <a
                href={item.path}
                className="flex items-center p-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
