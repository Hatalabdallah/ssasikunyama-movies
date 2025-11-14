import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, TrendingUp, Star, Film } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Movie {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  downloads_count: number;
}

// Image data for the slider
const IMAGES = [
  {
    src: "/sassi/content.jpg",
    alt: "Thor Love and Thunder"
  },
  {
    src: "/sassi/KUNYAMA-BACK.jpg",
    alt: "Uncharted Movie Scene"
  },
  {
    src: "/sassi/KUNYAMA-FRONT.jpg",
    alt: "1917 Movie Poster"
  },
  {
    src: "/sassi/SSASI.jpg",
    alt: "Aquaman Movie Scene"
  },
];

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

  // Image slider animation
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let animationFrameId: number;
    let position = 0;
    const speed = 0.8;

    const animate = () => {
      position -= speed;
      
      if (Math.abs(position) >= track.scrollWidth / 2) {
        position = 0;
      }
      
      track.style.transform = `translateX(${position}px)`;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Pop-up animation for images
  useEffect(() => {
    const timeouts = IMAGES.map((_, index) => 
      setTimeout(() => {
        setVisibleImages(prev => {
          const newVisible = [...prev];
          newVisible[index] = true;
          return newVisible;
        });
      }, index * 300)
    );

    return () => timeouts.forEach(timeout => clearTimeout(timeout));
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

      {/* Hero Section - REPLACED WITH IMAGE SLIDER */}
      <section className="relative bg-black overflow-hidden py-12">
        {/* Horizontal Scrolling Slider - Centered and compact */}
        <div className="relative z-10 overflow-visible">
          <div className="track-wrapper w-full">
            <ul 
              ref={trackRef}
              className="track flex space-x-8 w-max"
              style={{ willChange: 'transform' }}
            >            
              {/* First set of images with 3D effects */}
              {IMAGES.map((image, index) => (
                <li 
                  key={`first-${index}`} 
                  className="track__item flex-shrink-0"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className={cn(
                    "relative group transition-all duration-700 ease-out",
                    visibleImages[index] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
                    hoveredIndex === index ? "scale-110 z-20" : "scale-100"
                  )}>
                    {/* 3D Card Effect */}
                    <div className={cn(
                      "relative transition-all duration-500 ease-out transform-gpu",
                      hoveredIndex === index 
                        ? "rotate-y-6 -rotate-x-3 shadow-2xl" 
                        : "rotate-0 shadow-lg"
                    )}>
                      <img
                        src={image.src}
                        alt={image.alt}
                        width="400"
                        height="600"
                        className={cn(
                          "w-64 h-80 object-cover rounded-xl transition-all duration-500 border-2",
                          hoveredIndex === index 
                            ? "scale-110 brightness-110 border-green-400/50" 
                            : "scale-100 border-transparent"
                        )}
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: hoveredIndex === index ? 'perspective(1000px) rotateY(5deg) rotateX(-2deg)' : 'perspective(1000px) rotateY(0deg) rotateX(0deg)'
                        }}
                      />
                      
                      {/* Glow Effect */}
                      <div className={cn(
                        "absolute inset-0 rounded-xl transition-all duration-500",
                        hoveredIndex === index ? "bg-green-400/20 blur-xl" : "bg-transparent"
                      )} />
                    </div>

                    {/* Floating Info Card */}
                    <div className={cn(
                      "absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-lg p-4 transition-all duration-500 border border-green-400/30",
                      hoveredIndex === index 
                        ? "opacity-100 translate-y-0 scale-100" 
                        : "opacity-0 translate-y-4 scale-95"
                    )}>
                    </div>

                    {/* Shine Effect */}
                    <div className={cn(
                      "absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-1000",
                      hoveredIndex === index ? "translate-x-full" : "-translate-x-full"
                    )} />
                  </div>
                </li>
              ))}
              
              {/* Duplicate set for seamless loop */}
              {IMAGES.map((image, index) => (
                <li 
                  key={`second-${index}`} 
                  className="track__item flex-shrink-0"
                  onMouseEnter={() => setHoveredIndex(index + IMAGES.length)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className={cn(
                    "relative group transition-all duration-700 ease-out",
                    visibleImages[index] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
                    hoveredIndex === index + IMAGES.length ? "scale-110 z-20" : "scale-100"
                  )}>
                    <div className={cn(
                      "relative transition-all duration-500 ease-out transform-gpu",
                      hoveredIndex === index + IMAGES.length 
                        ? "rotate-y-6 -rotate-x-3 shadow-2xl" 
                        : "rotate-0 shadow-lg"
                    )}>
                      <img
                        src={image.src}
                        alt={image.alt}
                        width="400"
                        height="600"
                        className={cn(
                          "w-64 h-80 object-cover rounded-xl transition-all duration-500 border-2",
                          hoveredIndex === index + IMAGES.length 
                            ? "scale-110 brightness-110 border-green-400/50" 
                            : "scale-100 border-transparent"
                        )}
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: hoveredIndex === index + IMAGES.length ? 'perspective(1000px) rotateY(5deg) rotateX(-2deg)' : 'perspective(1000px) rotateY(0deg) rotateX(0deg)'
                        }}
                      />
                      
                      <div className={cn(
                        "absolute inset-0 rounded-xl transition-all duration-500",
                        hoveredIndex === index + IMAGES.length ? "bg-green-400/20 blur-xl" : "bg-transparent"
                      )} />
                    </div>

                    <div className={cn(
                      "absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-lg p-4 transition-all duration-500 border border-green-400/30",
                      hoveredIndex === index + IMAGES.length 
                        ? "opacity-100 translate-y-0 scale-100" 
                        : "opacity-0 translate-y-4 scale-95"
                    )}>
                    </div>

                    <div className={cn(
                      "absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-1000",
                      hoveredIndex === index + IMAGES.length ? "translate-x-full" : "-translate-x-full"
                    )} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* REST OF THE ORIGINAL CODE REMAINS EXACTLY THE SAME */}
      {/* Movies Carousel */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Trending Movies</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading trending movies...</p>
            </div>
          ) : trendingMovies.length > 0 ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {trendingMovies.map((movie) => (
                  <div key={movie.id} className="flex-none w-[200px] snap-start">
                    <Card className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all relative">
                      <div className="relative aspect-[2/3]">
                        <img 
                          src={movie.thumbnail_url} 
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-2 right-2 capitalize">
                          {movie.category}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-1">{movie.title}</h3>
                        <p className="text-sm text-muted-foreground">{movie.downloads_count} downloads</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trending Movies Yet</h3>
              <p className="text-muted-foreground">
                Movies will appear here as they become popular
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Unlock Full Access Today
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get instant access to thousands of local and English movies with flexible subscription plans starting from just UGX 5,000
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" onClick={() => navigate('/register')} className="text-lg px-8">
                  Subscribe Now
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8">
                  View All Plans
                </Button>
              </div>
            </CardContent>
          </Card>
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