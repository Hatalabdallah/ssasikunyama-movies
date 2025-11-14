import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { Film } from 'lucide-react';

export default function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: request, 2: reset
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await ApiService.requestPasswordReset(emailOrPhone);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Reset code sent to your email/phone');
      setStep(2);
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await ApiService.resetPassword(emailOrPhone, otp, newPassword);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Password reset successfully!');
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Film className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 ? 'Reset Password' : 'Enter Reset Code'}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? 'Enter your email or phone to receive a reset code' 
              : 'Enter the code sent to your email/phone and your new password'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                <Input
                  id="emailOrPhone"
                  placeholder="Enter email or phone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Reset Code</Label>
                <Input
                  id="otp"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
          
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}