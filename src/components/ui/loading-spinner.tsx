import { cn } from "@/lib/utils";

export const LoadingSpinner = ({ className }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex justify-center items-center h-48", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
};
