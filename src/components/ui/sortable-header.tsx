import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

export const SortableHeader = ({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className,
}: SortableHeaderProps) => {
  const isActive = currentSort === sortKey;

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        <span className="text-muted-foreground">
          {isActive ? (
            currentDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          )}
        </span>
      </div>
    </TableHead>
  );
};