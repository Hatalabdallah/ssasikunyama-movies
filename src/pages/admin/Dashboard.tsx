import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserCog, Film, Download, TrendingUp } from 'lucide-react';
import { ApiService } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  subscribedUsers: number;
  totalAgents: number;
  localMovies: number;
  englishMovies: number;
  totalDownloads: number;
}

interface TopMovie {
  title: string;
  downloads_count: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    subscribedUsers: 0,
    totalAgents: 0,
    localMovies: 0,
    englishMovies: 0,
    totalDownloads: 0,
  });
  const [topMovies, setTopMovies] = useState<TopMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load users to calculate stats
      const usersResult = await ApiService.getUsers();
      const moviesResult = await ApiService.getAllMovies();
      
      if (usersResult.error || moviesResult.error) {
        console.error('Failed to load dashboard data');
        return;
      }

      const users = usersResult.data || [];
      const movies = moviesResult.data?.movies || [];

      // Calculate stats
      const clientUsers = users.filter((u: any) => u.role === 'client');
      const subscribedUsers = clientUsers.filter((u: any) => {
        if (!u.subscriptionExpiry) return false;
        return new Date(u.subscriptionExpiry) > new Date();
      });

      const totalDownloads = movies.reduce((sum: number, movie: any) => sum + (movie.downloads_count || 0), 0);

      setStats({
        totalUsers: clientUsers.length,
        subscribedUsers: subscribedUsers.length,
        totalAgents: users.filter((u: any) => u.role === 'agent').length,
        localMovies: movies.filter((m: any) => m.category === 'local').length,
        englishMovies: movies.filter((m: any) => m.category === 'english').length,
        totalDownloads: totalDownloads,
      });

      // Get top downloaded movies
      const sortedMovies = [...movies]
        .sort((a: any, b: any) => (b.downloads_count || 0) - (a.downloads_count || 0))
        .slice(0, 5)
        .map((m: any) => ({ 
          title: m.title, 
          downloads_count: m.downloads_count || 0 
        }));
      
      setTopMovies(sortedMovies);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Subscribed Users', value: stats.subscribedUsers, icon: UserCheck, color: 'text-green-500' },
    { title: 'Total Agents', value: stats.totalAgents, icon: UserCog, color: 'text-purple-500' },
    { title: 'Local Movies', value: stats.localMovies, icon: Film, color: 'text-orange-500' },
    { title: 'English Movies', value: stats.englishMovies, icon: Film, color: 'text-red-500' },
    { title: 'Total Downloads', value: stats.totalDownloads, icon: Download, color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your movie platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Movies */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Top Downloaded Movies</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Loading top movies...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topMovies.map((movie, index) => (
                <div key={movie.title} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{movie.title}</p>
                  </div>
                  <div className="text-muted-foreground">
                    {movie.downloads_count} downloads
                  </div>
                </div>
              ))}
              {topMovies.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No downloads yet
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}