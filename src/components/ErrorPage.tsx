
import { useNavigate, useRouteError } from "react-router-dom";
import { Button } from "./ui/button";

export const ErrorPage = () => {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Une erreur est survenue</h1>
      <p className="text-xl text-gray-600 mb-6">
        Désolé, une erreur inattendue s'est produite
      </p>
      <p className="text-gray-500 mb-8">
        {error?.statusText || error?.message || "Erreur inconnue"}
      </p>
      <div className="space-x-4">
        <Button onClick={() => window.location.reload()}>
          Rafraîchir la page
        </Button>
        <Button variant="outline" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};
