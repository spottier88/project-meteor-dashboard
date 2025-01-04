import { TableHead } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHeaderProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

export const SortableHeader = ({ 
  children, 
  sortKey, 
  currentSort, 
  onSort,
  className,
  ...props 
}: SortableHeaderProps) => {
  const isSorted = currentSort?.key === sortKey;

  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none",
        className
      )} 
      onClick={() => onSort(sortKey)}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn(
          "h-4 w-4 transition-colors",
          isSorted ? "text-foreground" : "text-muted-foreground"
        )} />
      </div>
    </TableHead>
  );
};