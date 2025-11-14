import { useState, useEffect } from 'react';
import { SubscriptionPlan } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Calendar, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { ApiService } from '@/lib/api';

export default function ManagePlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    currency: 'UGX',
    startDate: '',
    endDate: '',
    description: '',
  });

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

  const handleOpenDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        amount: plan.amount,
        currency: plan.currency,
        startDate: plan.startDate,
        endDate: plan.endDate,
        description: plan.description,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        amount: 0,
        currency: 'UGX',
        startDate: '',
        endDate: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPlan) {
        const result = await ApiService.updatePlan(editingPlan.id, {
          name: formData.name,
          amount: formData.amount,
          currency: formData.currency,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
          isActive: editingPlan.isActive
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success('Plan updated successfully!');
      } else {
        const result = await ApiService.createPlan({
          name: formData.name,
          amount: formData.amount,
          currency: formData.currency,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success('Plan added successfully! It is inactive by default.');
      }
      
      loadPlans();
      setDialogOpen(false);
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivation = async (planId: string, isActive: boolean) => {
    try {
      const result = await ApiService.togglePlanActivation(planId, isActive);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, isActive } : plan
      ));

      toast.success(result.data!.message);
    } catch (error) {
      toast.error('Failed to update plan status');
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const result = await ApiService.deletePlan(id);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Plan deleted successfully!');
      loadPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage your seasonal subscription plans</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Update plan details' : 'Create a new seasonal subscription plan'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (UGX)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : (editingPlan ? 'Update Plan' : 'Add Plan')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading plans...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={(checked) => handleToggleActivation(plan.id, checked)}
                    />
                    {plan.isActive ? (
                      <Power className="h-4 w-4 text-green-500" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {plan.currency} {plan.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleOpenDialog(plan)} 
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
                        <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the "{plan.name}" plan? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(plan.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}