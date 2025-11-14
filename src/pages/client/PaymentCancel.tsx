import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was not completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You can try again anytime. Your subscription will be activated once payment is successful.
          </p>
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate('/client/subscribe')}
            >
              Try Again
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/client/home')}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}