import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type InvitationCard } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Import generated card images
import sikhAnandKarajImage from "@assets/generated_images/sikh_anand_karaj_gold_maroon.png";
import hinduMehendiImage from "@assets/generated_images/hindu_mehendi_orange_green.png";
import hinduSangeetImage from "@assets/generated_images/hindu_sangeet_purple_gold.png";
import hinduPherasImage from "@assets/generated_images/hindu_pheras_red_gold.png";
import muslimNikahImage from "@assets/generated_images/muslim_nikah_teal_gold.png";
import muslimMehndiImage from "@assets/generated_images/muslim_mehndi_emerald_gold.png";
import gujaratiGarbaImage from "@assets/generated_images/gujarati_garba_rainbow_colors.png";
import southIndianMuhurthamImage from "@assets/generated_images/south_indian_muhurtham_yellow_maroon.png";
import receptionImage from "@assets/generated_images/reception_gold_ivory_modern.png";
import hinduHaldiImage from "@assets/generated_images/hindu_haldi_yellow_orange.png";

// Map image URLs to actual imported images
const imageMap: Record<string, string> = {
  "@assets/generated_images/sikh_anand_karaj_gold_maroon.png": sikhAnandKarajImage,
  "@assets/generated_images/hindu_mehendi_orange_green.png": hinduMehendiImage,
  "@assets/generated_images/hindu_sangeet_purple_gold.png": hinduSangeetImage,
  "@assets/generated_images/hindu_pheras_red_gold.png": hinduPherasImage,
  "@assets/generated_images/muslim_nikah_teal_gold.png": muslimNikahImage,
  "@assets/generated_images/muslim_mehndi_emerald_gold.png": muslimMehndiImage,
  "@assets/generated_images/gujarati_garba_rainbow_colors.png": gujaratiGarbaImage,
  "@assets/generated_images/south_indian_muhurtham_yellow_maroon.png": southIndianMuhurthamImage,
  "@assets/generated_images/reception_gold_ivory_modern.png": receptionImage,
  "@assets/generated_images/hindu_haldi_yellow_orange.png": hinduHaldiImage,
};

interface CartItem {
  card: InvitationCard;
  quantity: number;
}

export default function Invitations() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [traditionFilter, setTraditionFilter] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);

  const { data: cards, isLoading } = useQuery<InvitationCard[]>({
    queryKey: ["/api/invitation-cards", traditionFilter],
    queryFn: async () => {
      const params = traditionFilter !== "all" ? `?tradition=${traditionFilter}` : "";
      const response = await fetch(`/api/invitation-cards${params}`);
      if (!response.ok) throw new Error("Failed to fetch invitation cards");
      return response.json();
    },
  });

  const addToCart = (card: InvitationCard) => {
    setCart(prev => {
      const existing = prev.find(item => item.card.id === card.id);
      if (existing) {
        return prev.map(item =>
          item.card.id === card.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { card, quantity: 1 }];
    });
    
    toast({
      title: "Added to cart",
      description: `${card.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (cardId: string) => {
    setCart(prev => prev.filter(item => item.card.id !== cardId));
  };

  const updateQuantity = (cardId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(cardId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.card.id === cardId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(item.card.price);
      return sum + (price * item.quantity);
    }, 0);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to checkout with cart data in state
    navigate("/checkout", { state: { cart } });
  };

  const formatCeremonyType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTradition = (tradition: string) => {
    const map: Record<string, string> = {
      'sikh': 'Sikh',
      'hindu': 'Hindu',
      'muslim': 'Muslim',
      'gujarati': 'Gujarati',
      'south_indian': 'South Indian',
      'mixed': 'Mixed/Fusion',
      'general': 'General'
    };
    return map[tradition] || tradition;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-playfair font-bold text-foreground mb-2">
          Invitation Cards
        </h1>
        <p className="text-muted-foreground text-lg">
          Browse our beautiful collection of culturally-authentic invitation designs
        </p>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <Select value={traditionFilter} onValueChange={setTraditionFilter}>
              <SelectTrigger className="w-64" data-testid="select-tradition-filter">
                <SelectValue placeholder="Filter by tradition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Traditions</SelectItem>
                <SelectItem value="sikh">Sikh</SelectItem>
                <SelectItem value="hindu">Hindu</SelectItem>
                <SelectItem value="muslim">Muslim</SelectItem>
                <SelectItem value="gujarati">Gujarati</SelectItem>
                <SelectItem value="south_indian">South Indian</SelectItem>
                <SelectItem value="mixed">Mixed/Fusion</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cards && cards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => (
                <Card key={card.id} className="overflow-hidden hover-elevate" data-testid={`card-invitation-${card.id}`}>
                  <div className="relative">
                    <img
                      src={imageMap[card.imageUrl] || card.imageUrl}
                      alt={card.name}
                      className="w-full h-64 object-cover"
                    />
                    {card.featured && (
                      <Badge className="absolute top-2 right-2 bg-primary" data-testid={`badge-featured-${card.id}`}>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold" data-testid={`text-card-name-${card.id}`}>
                        {card.name}
                      </CardTitle>
                      <span className="text-xl font-bold text-primary whitespace-nowrap" data-testid={`text-price-${card.id}`}>
                        ${parseFloat(card.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" data-testid={`badge-tradition-${card.id}`}>
                        {formatTradition(card.tradition)}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-ceremony-${card.id}`}>
                        {formatCeremonyType(card.ceremonyType)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm" data-testid={`text-description-${card.id}`}>
                      {card.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => addToCart(card)}
                      className="w-full"
                      data-testid={`button-add-to-cart-${card.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No invitation cards found for the selected filter.
              </p>
            </Card>
          )}
        </div>

        {/* Shopping Cart Sidebar */}
        {cart.length > 0 && (
          <div className="w-96">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Shopping Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map(item => (
                  <div key={item.card.id} className="flex gap-3 pb-3 border-b last:border-0" data-testid={`cart-item-${item.card.id}`}>
                    <img
                      src={imageMap[item.card.imageUrl] || item.card.imageUrl}
                      alt={item.card.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`cart-item-name-${item.card.id}`}>
                        {item.card.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`cart-item-price-${item.card.id}`}>
                        ${parseFloat(item.card.price).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.card.id, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                          data-testid={`button-decrease-${item.card.id}`}
                        >
                          -
                        </Button>
                        <span className="text-sm w-8 text-center" data-testid={`text-quantity-${item.card.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.card.id, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                          data-testid={`button-increase-${item.card.id}`}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item.card.id)}
                      data-testid={`button-remove-${item.card.id}`}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="w-full flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span data-testid="text-cart-total">${getTotalAmount().toFixed(2)}</span>
                </div>
                <Button
                  onClick={proceedToCheckout}
                  className="w-full"
                  size="lg"
                  data-testid="button-checkout"
                >
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
