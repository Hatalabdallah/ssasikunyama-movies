import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Film, Home, Download, User, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function ClientDashboard() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === '/client' || location.pathname === '/client/') {
      navigate('/client/home');
    }
  }, [location, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/client/home' },
    { icon: Film, label: 'Movies', path: '/client/movies' },
    { icon: Download, label: 'Downloads', path: '/client/downloads' },
    { icon: User, label: 'Profile', path: '/client/profile' },
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
    <div className="min-h-screen bg-background">
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
                    <span className="font-bold text-xl">Ssasikunyama</span>
                  </div>
                  <nav className="space-y-2">
                    <NavLinks />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            <Film className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Ssasikunyama</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:inline">{currentUser?.fullName}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24">
            <nav className="space-y-2">
              <NavLinks />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
