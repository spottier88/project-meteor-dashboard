import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useProjectCart } from "@/hooks/use-project-cart";
import { Badge } from "@/components/ui/badge";

export const CartButton = () => {
  const { cartItems } = useProjectCart();

  return (
    <Button variant="outline" size="sm" className="relative">
      <ShoppingCart className="h-4 w-4 mr-2" />
      Panier
      {cartItems.length > 0 && (
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {cartItems.length}
        </Badge>
      )}
    </Button>
  );
};