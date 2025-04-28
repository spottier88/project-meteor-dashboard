
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay = ({ message = "Chargement en cours..." }: LoadingOverlayProps) => {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
