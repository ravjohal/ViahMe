import { useState, useEffect } from "react";
import { useLocation as useWouterLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { InvitationCard } from "@shared/schema";

// Stripe publishable key - Referenced from blueprint:javascript_stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CartItem {
  card: InvitationCard;
  quantity: number;
}

interface CheckoutFormProps {
  cart: CartItem[];
  totalAmount: number;
  onSuccess: () => void;
}

function CheckoutForm({ cart, totalAmount, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
        data-testid="button-submit-payment"
      >
        {isProcessing ? "Processing..." : `Pay $${totalAmount.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [, navigate] = useWouterLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useWouterLocation()[0];
  
  // Get cart data from navigation state
  const cart: CartItem[] = (history.state as any)?.cart || [];
  
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
  });

  const totalAmount = cart.reduce((sum, item) => {
    const price = parseFloat(item.card.price);
    return sum + (price * item.quantity);
  }, 0);

  useEffect(() => {
    // Redirect if cart is empty
    if (cart.length === 0) {
      navigate("/invitations");
      return;
    }

    // Create order and payment intent when component mounts
    const createOrderAndPayment = async () => {
      try {
        // First create the order
        const orderResponse = await apiRequest("POST", "/api/orders", {
          weddingId: user?.id || '', // Will need to get actual wedding ID
          userId: user?.id || '',
          totalAmount: totalAmount.toFixed(2),
          shippingName: shippingInfo.name || 'TBD',
          shippingEmail: shippingInfo.email,
          shippingPhone: shippingInfo.phone || 'TBD',
          shippingAddress: shippingInfo.address || 'TBD',
          shippingCity: shippingInfo.city || 'TBD',
          shippingState: shippingInfo.state || 'TBD',
          shippingZip: shippingInfo.zip || 'TBD',
          shippingCountry: shippingInfo.country,
        });

        const orderData = await orderResponse.json();
        setOrderId(orderData.id);

        // Create order items
        for (const item of cart) {
          const price = parseFloat(item.card.price);
          await apiRequest("POST", `/api/orders/${orderData.id}/items`, {
            orderId: orderData.id,
            cardId: item.card.id,
            quantity: item.quantity,
            pricePerItem: price.toFixed(2),
            subtotal: (price * item.quantity).toFixed(2),
          });
        }

        // Create Stripe Payment Intent
        const paymentResponse = await apiRequest("POST", "/api/create-payment-intent", {
          amount: totalAmount,
          orderId: orderData.id,
        });

        const paymentData = await paymentResponse.json();
        setClientSecret(paymentData.clientSecret);
      } catch (error) {
        console.error("Error creating order:", error);
        toast({
          title: "Error",
          description: "Failed to create order. Please try again.",
          variant: "destructive",
        });
      }
    };

    createOrderAndPayment();
  }, []); // Run once on mount

  const handleSuccess = () => {
    navigate("/order-confirmation");
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-playfair font-bold mb-6">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.map(item => (
              <div key={item.card.id} className="flex justify-between text-sm" data-testid={`summary-item-${item.card.id}`}>
                <span>
                  {item.card.name} ×{item.quantity}
                </span>
                <span>${(parseFloat(item.card.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-4 border-t flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span data-testid="text-order-total">${totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, name: e.target.value }))}
                required
                data-testid="input-shipping-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={shippingInfo.email}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                required
                data-testid="input-shipping-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={shippingInfo.phone}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                data-testid="input-shipping-phone"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                required
                data-testid="input-shipping-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                  required
                  data-testid="input-shipping-city"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={shippingInfo.state}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                  required
                  data-testid="input-shipping-state"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={shippingInfo.zip}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, zip: e.target.value }))}
                required
                data-testid="input-shipping-zip"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {!clientSecret ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                cart={cart}
                totalAmount={totalAmount}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
