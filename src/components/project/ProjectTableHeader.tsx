import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const ProjectTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Nom du projet</TableHead>
        <TableHead>Chef de projet</TableHead>
        <TableHead>Organisation</TableHead>
        <TableHead>Statut</TableHead>
        <TableHead>Progression</TableHead>
        <TableHead>Avancement</TableHead>
        <TableHead>Dernière revue</TableHead>
        <TableHead>Suivi DGS</TableHead>
        <TableHead className="text-center">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};