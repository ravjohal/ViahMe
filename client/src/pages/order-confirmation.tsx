import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function OrderConfirmation() {
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="text-center">
        <CardHeader className="pb-8 pt-12">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-primary" data-testid="icon-success" />
          </div>
          <CardTitle className="text-3xl font-playfair">
            Order Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-12">
          <p className="text-lg text-muted-foreground" data-testid="text-confirmation-message">
            Thank you for your purchase! Your invitation cards have been ordered successfully.
          </p>
          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation with your order details and shipping information shortly.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              onClick={() => navigate("/invitations")}
              variant="outline"
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
