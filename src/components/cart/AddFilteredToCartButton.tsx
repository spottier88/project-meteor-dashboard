import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus } from "lucide-react";
import { useProjectCart } from "@/hooks/use-project-cart";
import { useToast } from "@/components/ui/use-toast";

interface AddFilteredToCartButtonProps {
  projectIds: string[];
}

export const AddFilteredToCartButton = ({ projectIds }: AddFilteredToCartButtonProps) => {
  const { cartItems, addToCart } = useProjectCart();
  const { toast } = useToast();

  const handleAddAllToCart = () => {
    let addedCount = 0;
    projectIds.forEach(id => {
      if (!cartItems.includes(id)) {
        addToCart(id);
        addedCount++;
      }
    });

    toast({
      title: addedCount > 0 ? "Projets ajoutés au panier" : "Information",
      description: addedCount > 0 
        ? `${addedCount} projet${addedCount > 1 ? 's' : ''} ajouté${addedCount > 1 ? 's' : ''} au panier`
        : "Tous les projets filtrés sont déjà dans votre panier",
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddAllToCart}
      className="flex items-center gap-2"
      disabled={projectIds.length === 0}
    >
      <Plus className="h-4 w-4" />
      <ShoppingCart className="h-4 w-4" />
      Ajouter les {projectIds.length} projets filtrés
    </Button>
  );
};