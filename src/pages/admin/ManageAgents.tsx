// src/pages/admin/ManageAgents.tsx - UPDATED
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input'; // Add this import
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { ApiService } from '@/lib/api';

export default function ManageAgents() {
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getUsers();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        // Convert API users to frontend User type and filter agents only
        const agentUsers = result.data
          .filter((user: any) => user.role === 'agent')
          .map((user: any) => ({
            id: user.id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            password: '', // Not stored from API for security
            role: user.role,
            subscriptionPlanId: user.subscriptionPlanId || undefined,
            subscriptionExpiry: user.subscriptionExpiry || undefined,
            createdAt: user.createdAt
          }));
        
        setAgents(agentUsers);
      }
    } catch (error) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (agent?: User) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        fullName: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        password: '', // Don't show current password
      });
    } else {
      setEditingAgent(null);
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
      if (editingAgent) {
        // Update agent (without password for now)
        const result = await ApiService.updateUser(editingAgent.id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success('Agent updated successfully!');
      } else {
        // Create new agent
        const result = await ApiService.createUser({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'agent',
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success('Agent added successfully!');
      }
      
      loadAgents();
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

      toast.success('Agent deleted successfully!');
      loadAgents();
    } catch (error) {
      toast.error('Failed to delete agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Agents</h1>
          <p className="text-muted-foreground">View and manage agent accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
              <DialogDescription>
                {editingAgent ? 'Update agent details' : 'Create a new agent account'}
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
              {!editingAgent && (
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
                {loading ? 'Please wait...' : (editingAgent ? 'Update Agent' : 'Add Agent')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading agents...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{agent.fullName}</h3>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {agent.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {agent.phone}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleOpenDialog(agent)} 
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
                        <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{agent.fullName}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(agent.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}