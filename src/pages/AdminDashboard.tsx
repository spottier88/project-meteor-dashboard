
import { Settings, Users, Building2, Bell, Activity, BookOpenText, FileText, BarChart3, Target, Key, Mail, Star, FileOutput, Shield, Wrench, Brain, MessageSquare, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Définition d'un élément de menu admin */
interface AdminItem {
  icon: LucideIcon;
  label: string;
  route: string;
}

/** Définition d'une catégorie regroupant plusieurs éléments */
interface AdminCategory {
  title: string;
  description: string;
  icon: LucideIcon;
  items: AdminItem[];
}

/** Catégories de l'administration avec leurs éléments */
const adminCategories: AdminCategory[] = [
  {
    title: "Droits & Organisation",
    description: "Utilisateurs, organisation et évaluations",
    icon: Shield,
    items: [
      { icon: Users, label: "Gestion des utilisateurs", route: "/admin/users" },
      { icon: Building2, label: "Gestion de l'organisation", route: "/admin/organization" },
      { icon: Star, label: "Évaluations", route: "/admin/ratings" },
    ],
  },
  {
    title: "Paramétrage",
    description: "Configuration générale de l'application",
    icon: Wrench,
    items: [
      { icon: Settings, label: "Paramètres généraux", route: "/admin/settings" },
      { icon: Activity, label: "Types d'activités", route: "/admin/activity-types" },
      { icon: Target, label: "Points d'activités", route: "/admin/activity-points" },
      { icon: Key, label: "Tokens API", route: "/admin/api-tokens" },
    ],
  },
  {
    title: "Modèles & Exports",
    description: "Modèles de projet, d'email et d'export",
    icon: FileText,
    items: [
      { icon: FileText, label: "Modèles de projet", route: "/admin/templates" },
      { icon: Mail, label: "Modèles d'email", route: "/admin/email-templates" },
      { icon: FileOutput, label: "Modèles d'export cadrage", route: "/admin/framing-export-templates" },
    ],
  },
  {
    title: "Intelligence Artificielle",
    description: "Templates et suivi de l'utilisation IA",
    icon: Brain,
    items: [
      { icon: BookOpenText, label: "Templates IA", route: "/admin/ai-prompts" },
      { icon: BarChart3, label: "Monitoring IA", route: "/admin/ai-monitoring" },
    ],
  },
  {
    title: "Communication",
    description: "Gestion des notifications utilisateurs",
    icon: MessageSquare,
    items: [
      { icon: Bell, label: "Gestion des notifications", route: "/admin/notifications" },
    ],
  },
];

export const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => void navigate("/")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres et les utilisateurs de l'application
        </p>
      </div>

      {/* Grille de catégories */}
      <div className="space-y-6">
        {adminCategories.map((category) => (
          <Card key={category.title}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <category.icon className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <Button
                    key={item.route}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => void navigate(item.route)}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-sm text-center">{item.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
