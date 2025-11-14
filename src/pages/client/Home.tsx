import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, TrendingUp, Calendar, Film } from 'lucide-react';
import { ApiService } from '@/lib/api';

interface Movie {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  downloads_count: number;
  uploaded_at: string;
}

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);

  useEffect(() => {
    loadTrendingMovies();
    checkSubscription();
  }, [currentUser]);

  const loadTrendingMovies = async () => {
    try {
      const result = await ApiService.getTrendingMovies();
      if (result.error) {
        console.error('Failed to load trending movies:', result.error);
        return;
      }
      setTrendingMovies(result.data?.movies || []);
    } catch (error) {
      console.error('Error loading trending movies:', error);
    }
  };

  const checkSubscription = async () => {
    if (currentUser?.subscriptionPlanId && currentUser?.subscriptionExpiry) {
      const expiry = new Date(currentUser.subscriptionExpiry);
      if (expiry > new Date()) {
        setHasSubscription(true);
        // Load plan details
        try {
          const result = await ApiService.getPlans();
          if (result.data) {
            const plan = result.data.find((p: any) => p.id.toString() === currentUser.subscriptionPlanId);
            setSubscriptionPlan(plan || null);
          }
        } catch (error) {
          console.error('Error loading plan details:', error);
        }
      }
    }
  };

  // FIXED: Show exact expiry date instead of days remaining
  const expiryDate = currentUser?.subscriptionExpiry 
    ? new Date(currentUser.subscriptionExpiry).toLocaleDateString()
    : null;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/80" />
        <div className="relative p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Welcome back, {currentUser?.fullName?.split(' ')[0]}!
          </h1>
          {hasSubscription ? (
            <div className="space-y-3 text-white/90">
              <p className="text-lg">
                You have full access to all movies
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                {/* FIXED: Show exact expiry date */}
                <span>{subscriptionPlan?.name} Plan - Expires {expiryDate}</span>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/client/movies')}
                className="mt-4"
              >
                Browse Movies
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-white/90">
              <p className="text-lg">
                Subscribe now to unlock thousands of movies
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/client/subscribe')}
                className="mt-4"
              >
                View Plans
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Trending Movies */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Trending Now</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {trendingMovies.map((movie) => (
            <Card key={movie.id} className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all">
              <div className="relative aspect-[3/4]">
                <img 
                  src={movie.thumbnail_url} 
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <Badge className="absolute top-2 right-2 text-xs capitalize">
                  {movie.category}
                </Badge>
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm line-clamp-1">{movie.title}</h3>
                <p className="text-xs text-muted-foreground">{movie.downloads_count} downloads</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription CTA */}
      {!hasSubscription && (
        <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
          <CardContent className="p-8 text-center">
            <Film className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-2">Unlock Full Access</h3>
            <p className="text-muted-foreground mb-6">
              Get instant access to all local and English movies with our flexible plans
            </p>
            <Button size="lg" onClick={() => navigate('/client/subscribe')}>
              Subscribe Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}