
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, Trash2, FileSearch } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectTemplateListProps {
  templates: {
    id: string;
    title: string;
    description: string;
    created_at?: string;
  }[];
  isLoading: boolean;
  onEdit: (template: { id: string; title: string; description: string }) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const ProjectTemplateList = ({
  templates,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
}: ProjectTemplateListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-lg text-muted-foreground mb-2">Aucun modèle de projet</p>
          <p className="text-sm text-muted-foreground">
            Créez votre premier modèle pour accélérer la création de vos projets.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle>{template.title}</CardTitle>
            <CardDescription>
              {new Date(template.created_at || "").toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm line-clamp-3">{template.description || "Aucune description"}</p>
          </CardContent>
          <CardFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(template.id)}
              className="flex-1"
            >
              <FileSearch className="mr-2 h-4 w-4" />
              Détails
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(template)}
              className="flex-1"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce modèle ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le modèle "{template.title}" sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(template.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
