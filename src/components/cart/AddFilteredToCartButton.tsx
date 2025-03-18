
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus } from "lucide-react";
import { useProjectCart } from "@/hooks/use-project-cart";
import { useToast } from "@/components/ui/use-toast";

interface AddFilteredToCartButtonProps {
  projectIds: string[];
  className?: string; // Add className to the interface
}

export const AddFilteredToCartButton = ({ 
  projectIds, 
  className 
}: AddFilteredToCartButtonProps) => {
  const { cartItems, addMultipleToCart } = useProjectCart();
  const { toast } = useToast();

  const handleAddAllToCart = () => {
    const projectsToAdd = projectIds.filter(id => !cartItems.includes(id));
    
    if (projectsToAdd.length > 0) {
      addMultipleToCart(projectsToAdd);
      toast({
        title: "Projets ajoutés au panier",
        description: `${projectsToAdd.length} projet${projectsToAdd.length > 1 ? 's' : ''} ajouté${projectsToAdd.length > 1 ? 's' : ''} au panier`,
      });
    } else {
      toast({
        title: "Information",
        description: "Tous les projets filtrés sont déjà dans votre panier",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddAllToCart}
      className={className}
      disabled={projectIds.length === 0}
    >
      <Plus className="h-4 w-4" />
      <ShoppingCart className="h-4 w-4" />
      Ajouter les {projectIds.length} projets filtrés
    </Button>
  );
};
