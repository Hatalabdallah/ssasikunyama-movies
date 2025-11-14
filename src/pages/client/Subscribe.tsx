import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionPlan } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Check, Smartphone, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ApiService } from '@/lib/api';
import Logger from '@/lib/logger';

export default function Subscribe() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [transactionToken, setTransactionToken] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getPlans();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        const subscriptionPlans = result.data.map((plan: any) => ({
          id: plan.id.toString(),
          name: plan.name,
          amount: plan.amount,
          currency: plan.currency || 'UGX',
          startDate: plan.startDate,
          endDate: plan.endDate,
          isActive: plan.isActive,
          description: plan.description,
          createdAt: plan.createdAt
        }));
        
        setPlans(subscriptionPlans);
      }
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentDialog(true);
  };

  const validatePhoneNumber = (phone: string) => {
    return /^07\d{8}$/.test(phone);
  };

  const handlePayment = async () => {
    if (!paymentMethod || !selectedPlan || !currentUser || !phoneNumber) {
      toast.error('Please fill all payment details');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid phone number (07XXXXXXXX)');
      return;
    }

    setProcessing(true);

    try {
      const result = await ApiService.initializePayment({
        planId: selectedPlan,
        phoneNumber,
        provider: paymentMethod
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setTransactionToken(result.data.transactionToken);
        toast.success('Payment initiated! Please check your phone to complete payment.');
        
        // Start verification polling
        startPaymentVerification(result.data.transactionToken);
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const startPaymentVerification = (token: string) => {
    setVerifying(true);
    
    const verifyInterval = setInterval(async () => {
      try {
        const result = await ApiService.verifyPayment(token);
        
        if (result.error) {
          Logger.log('Verification error:', result.error);
          return;
        }

        if (result.data) {
          if (result.data.success && result.data.status === 'completed') {
            clearInterval(verifyInterval);
            setVerifying(false);
            
            // Update user with subscription
            if (result.data.user) {
              updateUser(result.data.user);
            }
            
            toast.success('Payment successful! Subscription activated.');
            setShowPaymentDialog(false);
            navigate('/client/movies');
          } else if (result.data.status === 'pending') {
            Logger.log('Payment still processing...');
          }
        }
      } catch (error) {
        Logger.log('Verification failed:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop verification after 2 minutes
    setTimeout(() => {
      clearInterval(verifyInterval);
      setVerifying(false);
      toast.error('Payment verification timeout. Please check your phone and try again.');
    }, 120000);
  };

  const paymentMethods = [
    { id: 'mtn', name: 'MTN Mobile Money', icon: '📱' },
    { id: 'airtel', name: 'Airtel Money', icon: '📱' },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Select a seasonal subscription plan that works best for you
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <Card 
            key={plan.id} 
            className={`relative ${index === 1 ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {index === 1 && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold">
                  {plan.currency} {plan.amount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-sm">All Local Movies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-sm">All English Movies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-sm">HD Quality Downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-sm">Unlimited Downloads</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant={index === 1 ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={!plan.isActive}
              >
                {plan.isActive ? 'Subscribe Now' : 'Coming Soon'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Enter your mobile money details to complete subscription
            </DialogDescription>
          </DialogHeader>
          
          {verifying ? (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Processing Payment</h3>
                <p className="text-muted-foreground mt-2">
                  Please check your phone and enter your PIN to complete the payment.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This may take a few seconds...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Phone Number Input */}
              <div className="space-y-3">
                <Label htmlFor="phone">Mobile Money Number</Label>
                <Input
                  id="phone"
                  placeholder="07XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={processing}
                />
                <p className="text-sm text-muted-foreground">
                  Enter your MTN or Airtel number
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>Select Provider</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
                      <RadioGroupItem value={method.id} id={method.id} disabled={processing} />
                      <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                        <Smartphone className="h-5 w-5" />
                        <span>{method.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button 
                className="w-full" 
                onClick={handlePayment}
                disabled={!paymentMethod || !phoneNumber || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Initiating Payment...
                  </>
                ) : (
                  `Pay ${plans.find(p => p.id === selectedPlan)?.currency} ${plans.find(p => p.id === selectedPlan)?.amount.toLocaleString()}`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}