// src/pages/Login.tsx - UPDATED
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input'; // Add this import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { Film } from 'lucide-react';

export default function Login() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await ApiService.login(emailOrPhone, password);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        const { token, user } = result.data;
        
        // Convert backend user to frontend User type
        const frontendUser = {
          id: user.id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          password: '', // Not stored in frontend for security
          role: user.role,
          subscriptionPlanId: user.subscriptionPlanId || undefined,
          subscriptionExpiry: user.subscriptionExpiry || undefined,
          createdAt: user.createdAt
        };

        login(token, frontendUser);
        toast.success('Login successful!');

        // Navigate based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'agent') {
          navigate('/agent');
        } else {
          navigate('/client');
        }
      }
    } catch (error) {
      toast.error('An error occurred during login');
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register here
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}