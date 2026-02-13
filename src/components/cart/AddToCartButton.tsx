import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { useProjectCart } from "@/hooks/useProjectCart";
import { useToast } from "@/components/ui/use-toast";

interface AddToCartButtonProps {
  projectId: string;
  projectTitle: string;
}

export const AddToCartButton = ({ projectId, projectTitle }: AddToCartButtonProps) => {
  const { cartItems, addToCart, removeFromCart } = useProjectCart();
  const { toast } = useToast();
  const isInCart = cartItems.includes(projectId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCart) {
      removeFromCart(projectId);
      toast({
        title: "Projet retiré",
        description: `${projectTitle} a été retiré du panier`,
      });
    } else {
      addToCart(projectId);
      toast({
        title: "Projet ajouté",
        description: `${projectTitle} a été ajouté au panier`,
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-8 w-8"
      title={isInCart ? "Retirer du panier" : "Ajouter au panier"}
    >
      {isInCart ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
    </Button>
  );
};