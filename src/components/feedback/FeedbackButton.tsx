
import { useState } from "react";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FeedbackForm } from "./FeedbackForm";
import { useAuthContext } from "@/contexts/AuthContext";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuthContext();

  // Ne pas afficher le bouton si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
          title="Soumettre une demande"
        >
          <Bug className="h-6 w-6" />
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="overflow-y-auto z-50">
          <SheetHeader>
            <SheetTitle>Soumettre une demande</SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <FeedbackForm
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
