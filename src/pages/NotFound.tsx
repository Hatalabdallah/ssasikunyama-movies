import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlayCircle, TrendingUp, Star, Film, Home } from 'lucide-react';
import { ApiService } from '@/lib/api';

interface Movie {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  downloads_count: number;
}

export default function Index() {
  const navigate = useNavigate();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLUListElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [visibleImages, setVisibleImages] = useState<boolean[]>([]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  const loadTrendingMovies = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getPublicTrendingMovies();
      
      if (result.error) {
        console.error('Failed to load trending movies:', result.error);
        setTrendingMovies([]);
        return;
      }

      if (result.data?.movies) {
        setTrendingMovies(result.data.movies);
      }
    } catch (error) {
      console.error('Error loading trending movies:', error);
      setTrendingMovies([]);
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Page Not Found
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Oops! The page you're looking for seems to have left the theater. 
                It might have been removed or you entered the wrong URL.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/')}
                  className="text-lg px-8"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
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