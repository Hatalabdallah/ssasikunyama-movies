import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Film, Home, Users, CreditCard, UserCog, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/admin/dashboard');
    }
  }, [location, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Film, label: 'Movies', path: '/admin/movies' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: UserCog, label: 'Agents', path: '/admin/agents' },
    { icon: CreditCard, label: 'Plans', path: '/admin/plans' },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 border-r border-border bg-sidebar flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Film className="h-6 w-6 text-primary" />
                      <span className="font-bold text-xl">Admin Panel</span>
                    </div>
                    <nav className="space-y-2">
                      <NavLinks />
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <span className="font-semibold md:hidden">Admin Panel</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm hidden sm:inline">{currentUser?.fullName}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="md:hidden">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
