/**
 * @page FramingExportTemplateManagement
 * @description Page d'administration des modèles d'export de note de cadrage.
 * Permet de gérer les modèles DOCX utilisés pour le publipostage.
 */

import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ExportTemplateList } from "@/components/framing-export-templates/ExportTemplateList";
import { AvailablePlaceholders } from "@/components/framing-export-templates/AvailablePlaceholders";

export const FramingExportTemplateManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => void navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Modèles d'export de cadrage</h1>
        <p className="text-muted-foreground">
          Gérez les modèles DOCX utilisés pour l'export par publipostage de la note de cadrage.
        </p>
      </div>

      <div className="space-y-6">
        <ExportTemplateList />
        <AvailablePlaceholders />
      </div>
    </div>
  );
};
