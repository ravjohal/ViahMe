import { useState, useEffect } from "react";
import { useLocation as useWouterLocation, useParams } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, CheckCircle, Building2, Calendar, DollarSign, Shield, Clock } from "lucide-react";
import type { Booking, Vendor } from "@shared/schema";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface DepositPaymentFormProps {
  bookingId: string;
  depositAmount: number;
  vendorName: string;
  onSuccess: () => void;
}

function DepositPaymentForm({ bookingId, depositAmount, vendorName, onSuccess }: DepositPaymentFormProps) {
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
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await apiRequest("POST", `/api/bookings/${bookingId}/confirm-deposit`, {
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'succeeded',
        });
        
        toast({
          title: "Deposit Paid Successfully!",
          description: `Your booking with ${vendorName} is now confirmed.`,
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
      <div className="p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Shield className="w-4 h-4" />
          <span>Secure payment powered by Stripe</span>
        </div>
        <PaymentElement />
      </div>
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
        data-testid="button-pay-deposit"
      >
        {isProcessing ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${depositAmount.toFixed(2)} Deposit
          </>
        )}
      </Button>
    </form>
  );
}

export default function VendorDeposit() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const [, navigate] = useWouterLocation();
  const { toast } = useToast();
  
  const [clientSecret, setClientSecret] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [vendorName, setVendorName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { data: booking } = useQuery<Booking>({
    queryKey: ['/api/bookings', bookingId],
  });

  const { data: vendor } = useQuery<Vendor>({
    queryKey: ['/api/vendors', booking?.vendorId],
    enabled: !!booking?.vendorId,
  });

  useEffect(() => {
    async function createPaymentIntent() {
      if (!bookingId) return;
      
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", `/api/bookings/${bookingId}/create-deposit-intent`);
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setDepositAmount(data.depositAmount);
        setVendorName(data.vendorName);
      } catch (error: any) {
        console.error("Failed to create deposit intent:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to initialize payment",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    createPaymentIntent();
  }, [bookingId, toast]);

  const handleSuccess = () => {
    setPaymentSuccess(true);
  };

  if (paymentSuccess) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Deposit Paid!</h2>
            <p className="text-muted-foreground mb-6">
              Your booking with {vendorName} has been confirmed.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/vendors')} className="w-full" data-testid="button-view-vendors">
                <Building2 className="w-4 h-4 mr-2" />
                View My Vendors
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full" data-testid="button-return-dashboard">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">
              <CreditCard className="w-3 h-3 mr-1" />
              Secure Payment
            </Badge>
          </div>
          <CardTitle className="text-2xl">Pay Vendor Deposit</CardTitle>
          <CardDescription>
            Complete your deposit payment to confirm your booking
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !clientSecret ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Unable to initialize payment. Please try again.</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : (
            <>
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{vendorName || vendor?.name}</p>
                        <p className="text-sm text-muted-foreground">{vendor?.category}</p>
                      </div>
                    </div>
                  </div>
                  
                  {booking?.requestedDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(booking.requestedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Estimated Total</span>
                      <span className="font-medium">
                        ${booking?.estimatedCost ? parseFloat(booking.estimatedCost).toLocaleString() : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        Deposit Due Now
                      </span>
                      <span className="text-xl font-bold text-primary">
                        ${depositAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Elements 
                stripe={stripePromise} 
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#f97316',
                    },
                  },
                }}
              >
                <DepositPaymentForm
                  bookingId={bookingId}
                  depositAmount={depositAmount}
                  vendorName={vendorName}
                  onSuccess={handleSuccess}
                />
              </Elements>

              <div className="text-xs text-center text-muted-foreground pt-4 border-t">
                <p>Your payment information is encrypted and secure.</p>
                <p className="mt-1">Remaining balance will be due according to your contract terms.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
