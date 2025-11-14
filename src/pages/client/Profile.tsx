// src/pages/client/Profile.tsx - UPDATED
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers, saveUsers, getPlanById } from '@/lib/storage';
import { ApiService } from '@/lib/api'; // ← ADD THIS IMPORT
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input'; // Add this import
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const subscriptionPlan = currentUser?.subscriptionPlanId 
    ? getPlanById(currentUser.subscriptionPlanId)
    : null;

  const daysRemaining = currentUser?.subscriptionExpiry 
    ? Math.max(0, Math.ceil((new Date(currentUser.subscriptionExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isSubscriptionActive = daysRemaining > 0;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const users = getUsers();
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          fullName,
          email,
          phone,
        };
        saveUsers(users);
        updateUser(users[userIndex]);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Call API to change password
      const result = await ApiService.changePassword(currentPassword, newPassword);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Subscription</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSubscriptionActive ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{subscriptionPlan?.name} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionPlan?.currency} {subscriptionPlan?.amount.toLocaleString()}
                  </p>
                </div>
                <Badge className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {daysRemaining} days left
                </Badge>
              </div>
              <Button variant="outline" onClick={() => navigate('/client/subscribe')}>
                Upgrade Plan
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No active subscription</p>
              <Button onClick={() => navigate('/client/subscribe')}>
                Subscribe Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}