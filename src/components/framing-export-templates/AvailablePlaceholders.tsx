/**
 * @component AvailablePlaceholders
 * @description Affiche la liste des balises disponibles pour les modèles d'export.
 * Sert de référence pour l'administrateur lors de la création de modèles DOCX.
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const PLACEHOLDERS = [
  { tag: "{{titre_projet}}", description: "Titre du projet" },
  { tag: "{{code_projet}}", description: "Code projet" },
  { tag: "{{chef_projet}}", description: "Nom du chef de projet" },
  { tag: "{{etat}}", description: "Statut du cycle de vie (Actif, Brouillon, etc.)" },
  { tag: "{{date_debut}}", description: "Date de début du projet" },
  { tag: "{{date_fin}}", description: "Date de fin prévue" },
  { tag: "{{organisation}}", description: "Pôle > Direction > Service" },
  { tag: "{{description}}", description: "Description du projet" },
  { tag: "{{priorite}}", description: "Priorité du projet" },
  { tag: "{{avancement}}", description: "Pourcentage d'avancement" },
  { tag: "{{contexte}}", description: "Section cadrage : contexte" },
  { tag: "{{objectifs}}", description: "Section cadrage : objectifs" },
  { tag: "{{parties_prenantes}}", description: "Section cadrage : parties prenantes" },
  { tag: "{{gouvernance}}", description: "Section cadrage : gouvernance" },
  { tag: "{{calendrier}}", description: "Section cadrage : calendrier" },
  { tag: "{{livrables}}", description: "Section cadrage : livrables" },
  { tag: "{{indicateurs_reussite}}", description: "Section cadrage : indicateurs de réussite" },
  { tag: "{{equipe}}", description: "Liste des membres de l'équipe" },
  { tag: "{{risques}}", description: "Liste des risques identifiés" },
  { tag: "{{taches}}", description: "Liste des tâches du projet" },
  { tag: "{{date_generation}}", description: "Date et heure de génération du document" },
];

export const AvailablePlaceholders = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Balises disponibles
        </CardTitle>
        <CardDescription>
          Utilisez ces balises dans votre document DOCX. Elles seront automatiquement
          remplacées par les données du projet lors de l'export.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Balise</TableHead>
              <TableHead>Donnée remplacée</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLACEHOLDERS.map((p) => (
              <TableRow key={p.tag}>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {p.tag}
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
