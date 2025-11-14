import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Logger from '@/lib/logger';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // You can use the token from URL params if needed
    const token = searchParams.get('token');
    if (token) {
      Logger.log('Payment token:', token);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You now have full access to all movies. Start exploring our collection!
          </p>
          <Button 
            className="w-full" 
            onClick={() => navigate('/client/movies')}
          >
            Browse Movies
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}