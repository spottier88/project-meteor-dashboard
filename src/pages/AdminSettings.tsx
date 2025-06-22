
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AdminSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres généraux</h1>
        <p className="text-muted-foreground">
          Configuration générale de l'application
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration système</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Les paramètres généraux du système seront disponibles dans une prochaine version.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paramètres de notification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configuration des notifications système disponible dans une prochaine version.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paramètres de sécurité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configuration de la sécurité disponible dans une prochaine version.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
