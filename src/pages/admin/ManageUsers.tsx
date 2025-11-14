// src/pages/admin/ManageUsers.tsx - UPDATED
import { useState, useEffect } from 'react';
import { getPlans, getPlanById } from '@/lib/storage';
import { User } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input'; // Add this import
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Mail, Phone, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { ApiService } from '@/lib/api';

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getUsers();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        // Convert API users to frontend User type and filter clients only
        const clientUsers = result.data
          .filter((user: any) => user.role === 'client')
          .map((user: any) => ({
            id: user.id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            password: '', // Not stored from API for security
            role: user.role,
            subscriptionPlanId: user.subscriptionPlanId || undefined,
            subscriptionPlanName: user.subscriptionPlanName || 'None', // ← ADD THIS
            subscriptionExpiry: user.subscriptionExpiry || undefined,
            createdAt: user.createdAt
          }));
        
        setUsers(clientUsers);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        password: '', // Don't show current password
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Update user (without password for now)
        const result = await ApiService.updateUser(editingUser.id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success('User updated successfully!');
      } else {
        // Create new user
        const result = await ApiService.createUser({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'client',
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success('User added successfully!');
      }
      
      loadUsers();
      setDialogOpen(false);
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const result = await ApiService.deleteUser(id);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('User deleted successfully!');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const isSubscribed = (user: User) => {
    if (!user.subscriptionExpiry) return false;
    return new Date(user.subscriptionExpiry) > new Date();
  };

  const subscribedUsers = users.filter(isSubscribed);
  const unsubscribedUsers = users.filter(u => !isSubscribed(u));

    // Add this helper function to get plan name
  const getPlanName = (planId: string) => {
    const plans = getPlans();
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : 'Unknown Plan';
  };

const UserCard = ({ user }: { user: User }) => {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg">{user.fullName}</h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              {user.phone}
            </div>
            {/* SIMPLE PLAN NAME DISPLAY */}
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3" />
              Plan: {user.subscriptionPlanName || 'None'}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleOpenDialog(user)} 
            className="flex-1"
            disabled={loading}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="flex-1" disabled={loading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{user.fullName}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(user.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
          <p className="text-muted-foreground">View and manage client users</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user details' : 'Create a new user account'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : (editingUser ? 'Update User' : 'Add User')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading users...</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
            <TabsTrigger value="subscribed">Subscribed ({subscribedUsers.length})</TabsTrigger>
            <TabsTrigger value="unsubscribed">Not Subscribed ({unsubscribedUsers.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => <UserCard key={user.id} user={user} />)}
            </div>
          </TabsContent>
          <TabsContent value="subscribed" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscribedUsers.map(user => <UserCard key={user.id} user={user} />)}
            </div>
          </TabsContent>
          <TabsContent value="unsubscribed" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unsubscribedUsers.map(user => <UserCard key={user.id} user={user} />)}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}