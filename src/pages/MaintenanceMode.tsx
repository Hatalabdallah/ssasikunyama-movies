import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlayCircle, Wrench, Clock } from 'lucide-react';

export default function MaintenanceMode() {
  const navigate = useNavigate();

  const contactWhatsApp = () => {
    window.open('https://wa.me/256744619020', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Ssasikunyama</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>
      <section className="relative min-h-[80vh] bg-black overflow-hidden">
        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-full mb-6">
                <Wrench className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Maintenance Mode
                </span>
              </div>
              <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                We're Under Maintenance
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                We're improving your experience. We'll be back shortly.
              </p>
              <div className="flex items-center gap-3 justify-center text-lg text-white/70 mb-8">
                <Clock className="h-5 w-5" />
                <span>Back in 24 hours</span>
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  size="lg" 
                  onClick={contactWhatsApp}
                  className="text-lg px-8"
                >
                  Contact on WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Ssasikunyama. All rights reserved.</p>
          <p className="mt-2">
            Developed by{" "}
            <a 
              href="https://kyakabi.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Kyakabi Group
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}